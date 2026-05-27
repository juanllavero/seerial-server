import crypto from 'node:crypto';
import os from 'node:os';
import nodePath from 'node:path';
import type { Chapter } from '@seerial/domain';
import type { Response as ExpressResponse } from 'express';
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

    if (!fileSystemService.existsSync(videoPath)) {
      throw new NotFoundException(messages.errors.notFound.file);
    }

    const hash = crypto
      .createHash('md5')
      .update(videoPath + trackIdNum + startTimeNum)
      .digest('hex');
    const cacheDir = fileSystemService.join(os.tmpdir(), 'video_subs_cache');
    fileSystemService.createFolder(cacheDir);
    const cachedFile = fileSystemService.join(cacheDir, `${hash}.vtt`);

    res.setHeader('Content-Type', 'text/vtt');

    if (await fileSystemService.exists(cachedFile)) {
      fileSystemService.createReadStream(cachedFile).pipe(res);
      return;
    }

    const args: string[] = [];
    if (startTimeNum > 0) {
      args.push('-ss', startTimeNum.toString());
    }
    args.push('-i', videoPath, '-map', `0:s:${trackIdNum}`, '-f', 'webvtt', cachedFile);

    try {
      await executeFfmpeg(args);
      fileSystemService.createReadStream(cachedFile).pipe(res);
    } catch (error) {
      videoExtractionLogger.error(error, 'FFMPEG error generating subtitles');
      if (!res.headersSent) {
        res.status(500).send(messages.errors.server.internal);
      }
    }
  }

  /**
   * Generate chapter thumbnails for a video and store them on disk.
   * Returns chapters with thumbnailSrc populated (relative resource path).
   * Skips generation if thumbnails already exist for all chapters.
   */
  public async generateChapterThumbnails(
    videoId: string,
    videoPath: string,
    chapters: Chapter[],
  ): Promise<Chapter[]> {
    if (!chapters.length) return chapters;

    const relativeBase = fileSystemService.join(
      'resources',
      'img',
      'thumbnails',
      'chapters',
      videoId,
    );
    const thumbnailsDir = fileSystemService.getExternalPath(relativeBase);

    const thumbnailEntries = await fileSystemService.getFilesInFolder(thumbnailsDir);
    const alreadyGenerated =
      fileSystemService.existsSync(thumbnailsDir) &&
      thumbnailEntries.filter((entry) => entry.isFile() && entry.name.endsWith('.jpg')).length >=
      chapters.length;

    if (!alreadyGenerated) {
      fileSystemService.createFolder(thumbnailsDir);

      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const outputPath = nodePath.join(thumbnailsDir, `chapter_${i}.jpg`);
        const args = [
          '-ss',
          String(chapter.time),
          '-i',
          videoPath,
          '-frames:v',
          '1',
          '-vf',
          'scale=480:-1',
          '-y',
          outputPath,
        ];

        try {
          await executeFfmpeg(args);
        } catch (err) {
          videoExtractionLogger.error(
            { err, chapterIndex: i },
            'Failed to generate chapter thumbnail',
          );
        }
      }
    }

    return chapters.map((chapter, i) => ({
      ...chapter,
      thumbnailSrc: fileSystemService.join(relativeBase, `chapter_${i}.jpg`),
    }));
  }
}
