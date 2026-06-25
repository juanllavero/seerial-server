import { spawn } from 'node:child_process';
import path from 'node:path';
import { https } from 'follow-redirects';
import {
  downloaderService,
  fileSystemService,
  notificationService,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { resolveFfmpegPath } from '@/api/v1/shared/infrastructure/adapters/ffmpeg/nativeFfmpeg';
import { WriteQueue } from '@/api/v1/shared/infrastructure/services/WriteQueue';
import type { MediaSearchResult } from '@/data/interfaces/SearchResults';
import logger from '@/utils/logger';
import type { DownloaderServicePort } from '../../../application/ports/DownloaderServicePort';

const downloaderLogger = logger.child({ category: 'Downloader' });

const {
  packagedPath: ffmpegPathFinal,
  packagedExists: ffmpegStaticExists,
  systemPath: systemFfmpegPath,
  resolvedPath: ffmpegLocation,
} = resolveFfmpegPath();

const nodeExecutableName = path.basename(process.execPath).toLowerCase();
// If the server process itself is node, use its known path directly.
// Otherwise (e.g. packaged Electron), fall back to "node" so yt-dlp resolves it from PATH.

if (!ffmpegStaticExists && ffmpegPathFinal && systemFfmpegPath) {
  downloaderLogger.info(
    { ffmpegPathFinal, systemFfmpegPath },
    'ffmpeg-static path does not exist. Using system ffmpeg for yt-dlp',
  );
}

if (!ffmpegStaticExists && ffmpegPathFinal && !systemFfmpegPath) {
  downloaderLogger.warn(
    { ffmpegPathFinal },
    'ffmpeg-static path does not exist and system ffmpeg was not found. Continuing without explicit ffmpeg location',
  );
}

// Singleton queue: all auto-downloads are serialized so only one yt-dlp search+download
// runs at a time, preventing unbounded memory usage during library scans.
const autoDownloadQueue = new WriteQueue();

const MAX_SEARCH_QUERY_LENGTH = 300;

function normalizeSearchQuery(input: string): string {
  return input.trim().replace(/\s+/g, ' ').slice(0, MAX_SEARCH_QUERY_LENGTH);
}

function isSafeMediaUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function runProcessCaptureStdout(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
        return;
      }

      reject(
        new Error(
          `Process exited with code ${code ?? 'unknown'}${stderr ? `: ${stderr.trim()}` : ''}`,
        ),
      );
    });
  });
}

export class DownloaderServiceImpl implements DownloaderServicePort {
  private getBinDir = (): string => {
    return fileSystemService.getExternalPath(path.join('resources', 'lib'));
  };

  getYtDlpPath = (): string => {
    const binDir = fileSystemService.getExternalPath(path.join('resources', 'lib'));
    return path.join(binDir, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
  };

  private getDownloadURL(): string {
    if (process.platform === 'win32')
      return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    if (process.platform === 'darwin')
      return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
    return 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
  }

  /**
   * Force re-downloads yt-dlp, deleting the existing binary first.
   * Used to recover from a corrupt or outdated binary (e.g. missing DLL on Windows).
   */
  private async forceReDownloadYtDlp(): Promise<void> {
    const ytDlpPath = this.getYtDlpPath();
    try {
      if (fileSystemService.existsSync(ytDlpPath)) fileSystemService.deleteFile(ytDlpPath);
    } catch (err) {
      downloaderLogger.warn({ err }, 'Could not delete existing yt-dlp binary before re-download');
    }
    await this.downloadYoutubeDownloader();
  }

  /**
   * Downloads yt-dlp and assigns execution permissions on macOS/Linux
   */
  async downloadYoutubeDownloader(): Promise<void> {
    const binDir = this.getBinDir();
    const ytDlpPath = this.getYtDlpPath();

    if (fileSystemService.existsSync(ytDlpPath)) {
      downloaderLogger.info({ message: 'yt-dlp is already in:', ytDlpPath });
      return;
    }

    fileSystemService.createFolder(binDir);

    const url = this.getDownloadURL();

    downloaderLogger.info({ message: 'Downloading yt-dlp from:', url });

    return new Promise((resolve, reject) => {
      const file = fileSystemService.createWriteStream(ytDlpPath);

      https
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            file.destroy();
            if (fileSystemService.existsSync(ytDlpPath)) {
              fileSystemService.deleteFile(ytDlpPath);
            }
            reject(
              new Error(`[DepCheck]: Error downloading yt-dlp. HTTP code ${response.statusCode}`),
            );
            return;
          }

          response.pipe(file);

          file.on('finish', () => {
            try {
              if (process.platform !== 'win32') {
                fileSystemService.chmod(ytDlpPath, 0o755); // Add executable permission
              }
              resolve();
            } catch (err) {
              reject(err);
            }
          });

          file.on('error', (err) => {
            if (fileSystemService.existsSync(ytDlpPath)) {
              fileSystemService.deleteFile(ytDlpPath);
            }
            reject(err);
          });
        })
        .on('error', (err) => {
          // Clean partially downloaded file
          try {
            if (fileSystemService.existsSync(ytDlpPath)) fileSystemService.deleteFile(ytDlpPath);
          } catch { }
          reject(err);
        });
    });
  }

  public async searchVideos(query: string, numberOfResults: number): Promise<MediaSearchResult[]> {
    const safeQuery = normalizeSearchQuery(query);
    if (!safeQuery) {
      return [];
    }

    const ytDlpPath = downloaderService.getYtDlpPath();
    const searchArgs = [
      `ytsearch${numberOfResults > 0 ? numberOfResults : 1}:${safeQuery}`,
      '--dump-json',
      '--default-search',
      'ytsearch',
      '--no-playlist',
      '--no-check-certificate',
      '--geo-bypass',
      '--flat-playlist',
      '--skip-download',
      '--quiet',
      '--ignore-errors',
    ];

    if (ffmpegLocation) {
      searchArgs.push('--ffmpeg-location', ffmpegLocation);
    }

    if (nodeExecutableName.startsWith('node')) {
      searchArgs.push('--js-runtimes', `node:${process.execPath}`);
    } else {
      searchArgs.push('--js-runtimes', 'node');
    }

    try {
      const stdout = await runProcessCaptureStdout(ytDlpPath, searchArgs);

      if (!stdout) return [];

      // JSON parse
      const entries = stdout
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line));

      // biome-ignore lint/suspicious/noExplicitAny: <External data>
      return entries.map((entry: any) => ({
        id: entry.id,
        title: entry.title,
        url: entry.url,
        duration: entry.duration,
        thumbnail: entry.thumbnails && entry.thumbnails.length > 0 ? entry.thumbnails[0].url : '',
      }));
    } catch (error: unknown) {
      // Windows STATUS_DLL_NOT_FOUND (0xC0000135): binary is corrupt or missing a runtime.
      // Re-download yt-dlp and retry once.
      if (
        error instanceof Error &&
        (error as NodeJS.ErrnoException & { code?: number }).code === 3221225773
      ) {
        downloaderLogger.warn(
          { code: (error as NodeJS.ErrnoException & { code?: number }).code },
          'yt-dlp binary failed with DLL_NOT_FOUND — re-downloading and retrying',
        );
        try {
          await this.forceReDownloadYtDlp();
          const retryStdout = await runProcessCaptureStdout(ytDlpPath, searchArgs);
          if (!retryStdout) return [];
          const retryEntries = retryStdout
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => JSON.parse(line));
          // biome-ignore lint/suspicious/noExplicitAny: <External data>
          return retryEntries.map((entry: any) => ({
            id: entry.id,
            title: entry.title,
            url: entry.url,
            duration: entry.duration,
            thumbnail:
              entry.thumbnails && entry.thumbnails.length > 0 ? entry.thumbnails[0].url : '',
          }));
        } catch (retryError) {
          downloaderLogger.error(retryError, 'Error executing yt-dlp after re-download');
          return [];
        }
      }
      downloaderLogger.error(error, 'Error executing yt-dlp');
      return [];
    }
  }

  public async downloadVideo(url: string, downloadFolder: string, fileName: string): Promise<void> {
    if (!isSafeMediaUrl(url)) {
      throw new Error('Invalid media URL');
    }

    const folder = path.isAbsolute(downloadFolder)
      ? downloadFolder
      : fileSystemService.getExternalPath(downloadFolder);

    // Make sure the download path has a trailing slash
    const outputPath = path.join(folder, `${fileName}.webm`);

    // Remove if exists
    if (fileSystemService.existsSync(outputPath)) {
      try {
        fileSystemService.deleteFile(outputPath);
      } catch (error) {
        downloaderLogger.error({ error, outputPath }, 'File not removed');
      }
    }

    const command = downloaderService.getYtDlpPath();
    const args = ['-f', 'bestvideo*+bestaudio/best', '-o', outputPath, url, '-q', '--progress', '--force-overwrite'];

    if (ffmpegLocation) {
      args.push('--ffmpeg-location', ffmpegLocation);
    }

    if (nodeExecutableName.startsWith('node')) {
      args.push('--js-runtimes', `node:${process.execPath}`);
    } else {
      args.push('--js-runtimes', 'node');
    }

    this.downloadContent(command, args, fileName);
  }

  public async downloadAudio(url: string, downloadFolder: string, fileName: string): Promise<void> {
    if (!isSafeMediaUrl(url)) {
      throw new Error('Invalid media URL');
    }

    const folder = path.isAbsolute(downloadFolder)
      ? downloadFolder
      : fileSystemService.getExternalPath(downloadFolder);

    // Create folder if it doesn't exist
    fileSystemService.createFolder(folder);

    // Make sure the download path has a trailing slash
    const outputPath = path.join(folder, `${fileName}.opus`);

    // Remove if exists
    if (fileSystemService.existsSync(outputPath)) {
      try {
        fileSystemService.deleteFile(outputPath);
      } catch (error) {
        downloaderLogger.error({ error, outputPath }, 'File not removed');
      }
    }

    const command = downloaderService.getYtDlpPath();
    const args = ['-f', 'bestaudio/best', '-o', outputPath, url, '-q', '--progress', '--force-overwrite'];

    if (ffmpegLocation) {
      args.push('--ffmpeg-location', ffmpegLocation);
    }

    if (nodeExecutableName.startsWith('node')) {
      args.push('--js-runtimes', `node:${process.execPath}`);
    } else {
      args.push('--js-runtimes', 'node');
    }

    this.downloadContent(command, args, fileName);
  }

  private async downloadContent(command: string, args: string[], fileName: string) {
    try {
      const process = spawn(command, args, {
        shell: false,
        windowsHide: true,
      });

      process.stdout.on('data', (data: Buffer) => {
        const output = data.toString();

        // Parse progress percentage from yt-dlp output
        const match = output.match(/(\d+(\.\d+)?)%/);
        if (match) {
          const progress = parseFloat(match[1]);

          // Generate message for WebSockets
          const message = {
            header: 'DOWNLOAD_PROGRESS',
            body: String(progress),
          };

          // Send progress to the client
          notificationService.broadcast(JSON.stringify(message));
        }
      });

      process.stderr.on('data', (data: Buffer) => {
        const stderrOutput = data.toString();
        const stderrLines = stderrOutput
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);

        for (const line of stderrLines) {
          if (line.startsWith('WARNING:')) {
            downloaderLogger.warn({ stderr: line }, 'Download stderr');
            continue;
          }

          if (line.startsWith('ERROR:')) {
            downloaderLogger.error({ stderr: line }, 'Download stderr');
            continue;
          }

          downloaderLogger.info({ stderr: line }, 'Download stderr');
        }
      });

      process.on('close', (code: number) => {
        if (code === 0) {
          // Generate message for WebSockets
          const message = {
            header: 'DOWNLOAD_COMPLETE',
            body: fileName,
          };

          // Send complete message to the client
          notificationService.broadcast(JSON.stringify(message));
        } else {
          // Generate message for WebSockets
          const message = {
            header: 'DOWNLOAD_ERROR',
            body: code,
          };

          // Send error message to the client
          notificationService.broadcast(JSON.stringify(message));
        }
      });
    } catch (error) {
      downloaderLogger.error(error, 'Error executing yt-dlp');
    }
  }

  public autoDownloadFirstAudioResult(query: string, elementId: string): Promise<void> {
    // Enqueue so downloads run sequentially in the background, avoiding
    // spawning a yt-dlp process per item during large scans.
    autoDownloadQueue.enqueue(async () => {
      const result = await this.searchVideos(query, 1);

      if (result.length === 0) {
        downloaderLogger.warn({ query }, 'No results found for auto-download');
        return;
      }

      const video = result[0];
      const downloadFolder = fileSystemService.join('resources', 'music', elementId);

      await this.downloadAudio(video.url, downloadFolder, elementId);
    });

    // Return immediately — the caller (scan use-case) does not need to await this.
    return Promise.resolve();
  }
}
