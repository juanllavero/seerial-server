import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import path from 'node:path';
import { fileSystemService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { executeFfmpegPipeToStream } from '@/api/v1/shared/infrastructure/adapters/ffmpeg/nativeFfmpeg';
import {
    getSystemAllowedPaths,
    sanitizeVideoPath,
} from '@/api/v1/shared/infrastructure/services/SanitizationService';
import {
    BadRequestException,
    NotFoundException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import logger from '@/utils/logger';
import type {
    TranscodeVideoParams,
    VideoProcessingServicePort,
} from '../../application/ports/VideoProcessingServicePort';

const videoProcessingLogger = logger.child({ category: 'Video Processing' });

type ResolutionKey = '480p' | '720p' | '1080p' | '4K';
const resolutionMap: Record<string, number> = {
  '480p': 480,
  '720p': 720,
  '1080p': 1080,
  '4K': 2160,
};
const validBitrates: number[] = [
  200, 300, 700, 1500, 2000, 3000, 4000, 8000, 10000, 12000, 15000, 20000,
];

export class VideoProcessingServiceImpl implements VideoProcessingServicePort {
  transcodeAndStreamVideo(params: TranscodeVideoParams, res: ExpressResponse): void {
    const { path: videoPath, start: videoStart, audio: audioTrack, quality, bitrate } = params;
    const qualityValue = String(quality);
    const startValue = String(videoStart);

    try {
      const sanitizedVideoPath = sanitizeVideoPath(
        videoPath,
        getSystemAllowedPaths(),
        true, // Must exist
      );

      if (!fileSystemService.existsSync(sanitizedVideoPath)) {
        throw new NotFoundException(messages.errors.notFound.video);
      }

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');

      const args = ['-i', sanitizedVideoPath, '-acodec', 'opus', '-ab', '128k', '-f', 'mp4'];

      const isQualityZero = qualityValue === '0';
      const isValidResolution = Object.keys(resolutionMap).includes(qualityValue);
      const isValidBitrate = validBitrates.includes(bitrate);

      if (isQualityZero || !isValidResolution || !isValidBitrate) {
        args.push('-vcodec', 'copy');
      } else {
        const resolutionHeight = resolutionMap[qualityValue as ResolutionKey];
        args.push(
          '-vcodec',
          'libx264',
          '-b:v',
          `${bitrate}k`,
          '-vf',
          `scale=-2:${resolutionHeight}`,
          '-preset',
          'veryfast',
        );
      }

      args.push(
        '-movflags',
        'frag_keyframe+empty_moov',
        '-ss',
        startValue,
        '-map',
        '0:v:0',
        '-map',
        `0:a:${audioTrack}`,
        '-copyts',
        '-avoid_negative_ts',
        'make_zero',
        '-max_muxing_queue_size',
        '1024',
      );

      const streaming = executeFfmpegPipeToStream(
        args,
        res,
        (err) => {
          videoProcessingLogger.error(err, 'FFmpeg spawn error');
          if (!res.headersSent) {
            res.writeHead(500);
          }
          res.end();
        },
        (code) => {
          if (code !== 0) {
            videoProcessingLogger.error({ exitCode: code }, 'FFmpeg error: process exited');
            if (!res.headersSent) {
              res.writeHead(500);
            }
            res.end();
          }
        },
      );

      res.on('close', () => {
        logger.info('Client disconnected, cancelling stream');
        streaming.cancel();
      });

      // Debugging
      setTimeout(() => {
        logger.debug({ message: 'FFmpeg output', stderr: streaming.stderr });
      }, 1000);
    } catch (error) {
      const message = error instanceof Error ? error.message : `Invalid video path: ${videoPath}`;
      throw new BadRequestException(message);
    }
  }

  streamDirectVideoFile(req: ExpressRequest, res: ExpressResponse): void {
    const { path: videoPath } = req.videoParams;

    try {
      const sanitizedVideoPath = sanitizeVideoPath(
        videoPath,
        getSystemAllowedPaths(),
        true, // Must exist
      );

      if (!fileSystemService.existsSync(sanitizedVideoPath)) {
        throw new NotFoundException(messages.errors.notFound.video);
      }

      const stat = fileSystemService.getFileStatsSync(sanitizedVideoPath);
      if (!stat) {
        throw new NotFoundException(messages.errors.notFound.video);
      }
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
          res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
          return;
        }

        const chunkSize = end - start + 1;
        const file = fileSystemService.createReadStream(sanitizedVideoPath, { start, end });
        const ext = path.extname(sanitizedVideoPath).toLowerCase();
        const contentType = this.getVideoContentType(ext);

        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': contentType,
          'Cross-Origin-Resource-Policy': 'cross-origin',
        });
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'video/mp4',
          'Cross-Origin-Resource-Policy': 'cross-origin',
        });
        fileSystemService.createReadStream(sanitizedVideoPath).pipe(res);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : `Invalid video path: ${videoPath}`;
      throw new BadRequestException(message);
    }
  }

  private getVideoContentType(ext: string): string {
    const typeMap: Record<string, string> = {
      '.mkv': 'video/x-matroska',
      '.m2ts': 'video/MP2T',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
    };
    return typeMap[ext] || 'video/mp4'; // Fallback to MP4
  }
}
