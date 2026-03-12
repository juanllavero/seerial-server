import crypto from 'node:crypto';
import os from 'node:os';
import type { Response as ExpressResponse } from 'express';
import fs from 'fs-extra';
import { fileSystemService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import {
  executeFfmpeg,
  executeFfmpegPipeToStream,
} from '@/api/v1/shared/infrastructure/adapters/ffmpeg/nativeFfmpeg';
import {
  BadRequestException,
  NotFoundException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import logger from '@/utils/logger';
import type { VideoExtractionServicePort } from '../../application/ports/VideoExtractionServicePort';

const videoExtractionLogger = logger.child({ category: 'Video Extraction' });

export class VideoExtractionServiceImpl implements VideoExtractionServicePort {
  /**
   * Extract video thumbnail and stream it to response
   */
  public async streamVideoThumbnail(
    videoUrl: string,
    time: string,
    res: ExpressResponse,
  ): Promise<void> {
    const timeParam = time || '10';

    if (!videoUrl) {
      throw new BadRequestException(messages.errors.validation.notEnoughParams);
    }

    const videoSrc = videoUrl.startsWith('resources')
      ? fileSystemService.getExternalPath(videoUrl)
      : videoUrl;

    res.setHeader('Content-Type', 'image/jpeg');

    const args = ['-i', videoSrc, '-ss', timeParam, '-frames:v', '1', '-f', 'mjpeg'];

    executeFfmpegPipeToStream(
      args,
      res,
      (err) => {
        videoExtractionLogger.error(err, 'FFMPEG error generating thumbnail');
        if (!res.headersSent) {
          res.status(500).send(messages.errors.server.internal);
        }
      },
      (code) => {
        if (code !== 0) {
          videoExtractionLogger.error({ exitCode: code }, 'FFmpeg error: process exited');
          if (!res.headersSent) {
            res.status(500).send(messages.errors.server.internal);
          }
        }
      },
    );
  }

  /**
   * Extract subtitle track from video and stream it to response
   */
  public async streamVideoSubtitles(
    videoPath: string,
    trackId: number,
    startTime: number,
    res: ExpressResponse,
  ): Promise<void> {
    const trackIdNum = trackId;
    const startTimeNum = startTime || 0;

    if (Number.isNaN(trackIdNum)) {
      throw new BadRequestException(messages.errors.validation.invalidData);
    }

    if (!fs.existsSync(videoPath)) {
      throw new NotFoundException(messages.errors.notFound.file);
    }

    const hash = crypto
      .createHash('md5')
      .update(videoPath + trackIdNum + startTimeNum)
      .digest('hex');
    const cacheDir = fileSystemService.join(os.tmpdir(), 'video_subs_cache');
    await fs.ensureDir(cacheDir);
    const cachedFile = fileSystemService.join(cacheDir, `${hash}.vtt`);

    res.setHeader('Content-Type', 'text/vtt');

    if (await fs.pathExists(cachedFile)) {
      fs.createReadStream(cachedFile).pipe(res);
      return;
    }

    const args: string[] = [];
    if (startTimeNum > 0) {
      args.push('-ss', startTimeNum.toString());
    }
    args.push('-i', videoPath, '-map', `0:s:${trackIdNum}`, '-f', 'webvtt', cachedFile);

    try {
      await executeFfmpeg(args);
      fs.createReadStream(cachedFile).pipe(res);
    } catch (error) {
      videoExtractionLogger.error(error, 'FFMPEG error generating subtitles');
      if (!res.headersSent) {
        res.status(500).send(messages.errors.server.internal);
      }
    }
  }
}
