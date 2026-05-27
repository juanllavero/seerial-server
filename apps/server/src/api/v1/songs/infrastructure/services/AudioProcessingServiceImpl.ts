import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import path from 'node:path';
import type { Request, Response } from 'express';
import {
    fileSystemService,
    notificationService,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { executeFfmpeg } from '@/api/v1/shared/infrastructure/adapters/ffmpeg/nativeFfmpeg';
import {
    BadRequestException,
    NotFoundException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import { audioExtensions } from '@/utils/constants';
import logger from '@/utils/logger';
import type {
    AudioProcessingServicePort,
    StemSeparationJob,
    StemSeparationJobStatus,
} from '../../application/ports/AudioProcessingServicePort';

const audioProcessingLogger = logger.child({
  category: 'Audio Processing Service',
});

const STEM_SEPARATION_EVENT = 'SONG_STEM_SEPARATION_STATUS';
const AUDIO_SEPARATOR_COMMAND = 'audio-separator';

type StemSeparationUpdate = Partial<StemSeparationJob> & {
  status: StemSeparationJobStatus;
  message?: string;
  progress?: number;
};

export class AudioProcessingServiceImpl implements AudioProcessingServicePort {
  private cacheDir: string;
  private readonly activeStemJobs = new Map<string, StemSeparationJob>();

  private getAudioContentType(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();

    const typeMap: Record<string, string> = {
      '.mp3': 'audio/mpeg',
      '.flac': 'audio/flac',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.opus': 'audio/ogg',
      '.ogg': 'audio/ogg',
      '.aac': 'audio/aac',
      '.wma': 'audio/x-ms-wma',
      '.webm': 'audio/webm',
      '.caf': 'audio/x-caf',
    };

    return typeMap[extension] ?? 'application/octet-stream';
  }

  constructor() {
    this.cacheDir = path.join(fileSystemService.resourcesPath, 'cache', 'audio');
    fileSystemService.createFolder(this.cacheDir);
  }

  async ensureStemSeparationAvailable(): Promise<void> {
    const result = spawnSync(AUDIO_SEPARATOR_COMMAND, ['--version'], {
      encoding: 'utf-8',
      shell: true,
    });

    const stderrOutput = result.stderr?.toString().trim() ?? '';
    const stdoutOutput = result.stdout?.toString().trim() ?? '';
    const combinedOutput = `${stdoutOutput}\n${stderrOutput}`.toLowerCase();

    if (
      result.error ||
      result.status !== 0 ||
      combinedOutput.includes('not recognized') ||
      combinedOutput.includes('not found')
    ) {
      throw new BadRequestException(messages.errors.server.audioSeparatorUnavailable);
    }
  }

  /**
   * Determines the final audio file path that can be transmitted,
   * performing a conversion to MP3 if necessary.
   * @param originalPath The path to the original audio file.
   * @param isWeb Whether the client is a web platform that requires compatible codecs.
   * @returns The path to the audio file ready to be transmitted.
   */
  async getStreamableAudioPath(originalPath: string, isWeb: boolean): Promise<string> {
    if (!fileSystemService.existsSync(originalPath)) {
      throw new NotFoundException(messages.errors.notFound.file);
    }

    const fileExtension = path.extname(originalPath).toLowerCase();
    const isCompatible = audioExtensions.includes(fileExtension);

    // If not for web or compatible, just return the original path
    if (!isWeb || isCompatible) {
      return originalPath;
    }

    // Conversion and cache logic
    const originalPathHash = crypto.createHash('md5').update(originalPath).digest('hex');
    const cachedFilePath = path.join(this.cacheDir, `${originalPathHash}.mp3`);

    // Check if cached file already exists
    if (fileSystemService.existsSync(cachedFilePath)) {
      return cachedFilePath;
    }

    // Needs conversion
    try {
      await executeFfmpeg([
        '-i',
        originalPath,
        '-acodec',
        'libmp3lame',
        '-ab',
        '320k',
        cachedFilePath,
      ]);

      return cachedFilePath;
    } catch (_error) {
      // Clean failed file if created
      if (fileSystemService.existsSync(cachedFilePath)) fileSystemService.deleteFile(cachedFilePath);
      throw new Error(messages.errors.server.internal);
    }
  }

  /**
   * Sends a file to the client with support for streaming (HTTP 206 Partial Content).
   * @param filePath The path to the file that will be transmitted.
   */
  streamFile(filePath: string, req: Request, res: Response): void {
    const stat = fileSystemService.getFileStatsSync(filePath);
    if (!stat) {
      throw new NotFoundException(messages.errors.notFound.file);
    }
    const fileSize = stat.size;
    const range = req.headers.range;
    const contentType = this.getAudioContentType(filePath);

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fileSystemService.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = { 'Content-Length': fileSize, 'Content-Type': contentType };
      res.writeHead(200, head);
      fileSystemService.createReadStream(filePath).pipe(res);
    }
  }

  async queueStemSeparation(songId: string, audioPath: string): Promise<StemSeparationJob> {
    await this.ensureStemSeparationAvailable();

    if (!(await fileSystemService.isFile(audioPath))) {
      throw new NotFoundException(messages.errors.notFound.file);
    }

    const activeJob = this.activeStemJobs.get(songId);
    if (activeJob) {
      return activeJob;
    }

    const outputPaths = this.buildStemOutputPaths(audioPath);

    fileSystemService.deleteFile(outputPaths.instrumentalPath);
    fileSystemService.deleteFile(outputPaths.vocalsPath);

    const job: StemSeparationJob = {
      jobId: crypto.randomUUID(),
      songId,
      inputPath: audioPath,
      instrumentalPath: outputPaths.instrumentalPath,
      vocalsPath: outputPaths.vocalsPath,
      status: 'queued',
      message: 'Stem separation queued.',
    };

    this.activeStemJobs.set(songId, job);
    this.broadcastStemUpdate(job, {
      status: 'queued',
      message: 'Stem separation queued.',
    });

    this.startStemSeparationProcess(job);

    return job;
  }

  private buildStemOutputPaths(audioPath: string): {
    instrumentalPath: string;
    vocalsPath: string;
    outputDir: string;
    instrumentalName: string;
    vocalsName: string;
  } {
    const parsedPath = path.parse(audioPath);
    const instrumentalName = `${parsedPath.name}.inst`;
    const vocalsName = `${parsedPath.name}.vocals`;

    return {
      outputDir: parsedPath.dir,
      instrumentalName,
      vocalsName,
      instrumentalPath: path.join(parsedPath.dir, `${instrumentalName}.flac`),
      vocalsPath: path.join(parsedPath.dir, `${vocalsName}.flac`),
    };
  }

  private startStemSeparationProcess(job: StemSeparationJob): void {
    const outputPaths = this.buildStemOutputPaths(job.inputPath);
    const customOutputNames = JSON.stringify({
      Instrumental: outputPaths.instrumentalName,
      Vocals: outputPaths.vocalsName,
    });
    const process = spawn(
      AUDIO_SEPARATOR_COMMAND,
      [
        job.inputPath,
        '--output_dir',
        outputPaths.outputDir,
        '--output_format',
        'FLAC',
        '--custom_output_names',
        customOutputNames,
      ],
      {
        shell: true,
      },
    );

    this.broadcastStemUpdate(job, {
      status: 'started',
      message: 'Stem separation started.',
    });

    process.stdout.on('data', (data: Buffer) => {
      this.handleStemProcessChunk(job, data.toString(), 'info');
    });

    process.stderr.on('data', (data: Buffer) => {
      this.handleStemProcessChunk(job, data.toString(), 'error');
    });

    process.on('error', (error) => {
      audioProcessingLogger.error({ error, songId: job.songId }, 'Stem separation process failed');
      this.broadcastStemUpdate(job, {
        status: 'error',
        message: messages.errors.server.stemSeparationFailed,
      });
      this.activeStemJobs.delete(job.songId);
    });

    process.on('close', async (code: number | null) => {
      if (
        code === 0 &&
        (await fileSystemService.isFile(job.instrumentalPath)) &&
        (await fileSystemService.isFile(job.vocalsPath))
      ) {
        this.broadcastStemUpdate(job, {
          status: 'completed',
          message: 'Stem separation completed.',
          progress: 100,
        });
      } else {
        audioProcessingLogger.error(
          {
            code,
            songId: job.songId,
            instrumentalPath: job.instrumentalPath,
            vocalsPath: job.vocalsPath,
          },
          'Stem separation finished without expected outputs',
        );
        this.broadcastStemUpdate(job, {
          status: 'error',
          message: messages.errors.server.stemSeparationFailed,
        });
      }

      this.activeStemJobs.delete(job.songId);
    });
  }

  private handleStemProcessChunk(
    job: StemSeparationJob,
    chunk: string,
    severity: 'info' | 'error',
  ): void {
    const lines = chunk
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    for (const line of lines) {
      const match = line.match(/(\d+(?:\.\d+)?)%/);
      const progress = match ? Number.parseFloat(match[1]) : undefined;

      if (severity === 'error') {
        audioProcessingLogger.warn({ songId: job.songId, stderr: line }, 'Stem separation stderr');
      } else {
        audioProcessingLogger.info({ songId: job.songId, stdout: line }, 'Stem separation stdout');
      }

      this.broadcastStemUpdate(job, {
        status: 'processing',
        message: line,
        progress,
      });
    }
  }

  private broadcastStemUpdate(job: StemSeparationJob, update: StemSeparationUpdate): void {
    const nextJob: StemSeparationJob = {
      ...job,
      ...update,
    };

    this.activeStemJobs.set(job.songId, nextJob);

    notificationService.broadcast(
      JSON.stringify({
        header: STEM_SEPARATION_EVENT,
        body: nextJob,
      }),
    );
  }
}
