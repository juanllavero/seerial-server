import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import jwt from 'jsonwebtoken';
import path from 'node:path';
import { Body, Controller, Get, Post, Request, Route, Security, Tags } from 'tsoa';
import {
  fileSystemService,
  moviesRepo,
  seasonsRepo,
  seriesRepo,
  useCases,
  videoProcessingService,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import { verifyVideoStreamToken } from '@/middleware/video.middleware';
import { getJwtSecret } from '@/utils/jwt-secret';
import type { StreamUrlDTO, VideoUrlDTO } from '../../../application/dtos/VideoStreamingDTOs';
import type { TranscodeVideoParams } from '../../../application/ports/VideoProcessingServicePort';

type AuthenticatedRequest = ExpressRequest & { user?: { id?: string } };
type VideoParamsRequest = ExpressRequest & {
  videoParams: TranscodeVideoParams;
};

@Route('video-streaming')
@Tags('Video Streaming')
export class VideoStreamingController extends Controller {
  private isLoopbackRequest(req?: ExpressRequest): boolean {
    if (!req) return false;
    const ip = req.ip || req.socket?.remoteAddress || '';
    if (!ip) return false;
    if (ip === '::1' || ip === '127.0.0.1') return true;
    if (ip.startsWith('::ffff:')) {
      const mapped = ip.replace('::ffff:', '');
      if (mapped === '127.0.0.1' || mapped.startsWith('127.')) return true;
    }
    return ip.startsWith('127.');
  }

  private async resolveVideoPath(
    filePath: string,
    localId?: string,
    req?: ExpressRequest,
  ): Promise<string | null> {
    if (!localId) {
      const normalizedPath = (filePath || '').trim();
      if (!normalizedPath || normalizedPath === 'none') {
        return null;
      }

      // Prefer known library media paths for any client.
      const getVideoByPathFactory = (useCases as { getVideoByPath?: () => { execute: (filePath: string) => Promise<{ fileSrc?: string } | null> } }).getVideoByPath;
      if (typeof getVideoByPathFactory === 'function') {
        const knownVideo = await getVideoByPathFactory().execute(normalizedPath);
        if (knownVideo?.fileSrc) {
          return knownVideo.fileSrc;
        }
      } else {
        // Compatibility fallback for test/mocked environments missing this use case.
        return normalizedPath;
      }

      // Keep desktop local-file playback working when the request is local.
      if (this.isLoopbackRequest(req)) {
        return normalizedPath;
      }

      return null;
    }

    // Try movie media folder
    const movie = moviesRepo?.findById ? await moviesRepo.findById(localId) : null;
    if (movie?.folder) {
      const mediaFolder = path.join(movie.folder, 'media');
      const [videoPath] = await fileSystemService.getValidVideoFiles(mediaFolder);
      if (videoPath) return videoPath;
    }

    // Try season media folder (localId is season id)
    const season = seasonsRepo?.findById ? await seasonsRepo.findById(localId, 'few') : null;
    if (season) {
      const series = seriesRepo?.findById ? await seriesRepo.findById(season.seriesId, 'few') : null;
      if (series?.folder) {
        const mediaFolder = path.join(series.folder, 'media');
        const prefix = `s${season.seasonNumber}_video`;
        const [videoPath] = await fileSystemService.getValidVideoFiles(mediaFolder);
        if (videoPath && path.basename(videoPath).startsWith(prefix)) return videoPath;
        // Fallback: any video prefixed with sN_
        const all = await fileSystemService.getValidVideoFiles(mediaFolder);
        const match = all.find((p) => path.basename(p).startsWith(`s${season.seasonNumber}_`));
        if (match) return match;
      }
    }

    // Legacy fallback: resources/videos/{localId}
    const localFolder = fileSystemService.getExternalPath(
      fileSystemService.join('resources', 'videos', localId),
    );

    if (!(await fileSystemService.isFolder(localFolder))) {
      return null;
    }

    const [resolvedPath] = await fileSystemService.getValidVideoFiles(localFolder);

    return resolvedPath ?? null;
  }

  private getStreamingResponse(req: ExpressRequest): ExpressResponse {
    if (!req.res) {
      throw new Error('Streaming response object is not available');
    }

    return req.res;
  }

  /**
   * Generate a JWT-signed URL for video streaming with transcoding
   */
  @Post('transcoded-url')
  @Security('cookieAuth')
  public async getStreamUrl(
    @Body() body: StreamUrlDTO,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<string>> {
    const userId = (req as AuthenticatedRequest).user?.id as string;

    const { filePath, start, audio, quality, bitrate, expiresIn } = body;
    const resolvedPath = await this.resolveVideoPath(filePath, undefined, req);

    if (!resolvedPath) {
      return ApiResponse.success('', messages.success.fetch);
    }

    const jwtSecret = getJwtSecret();
    const token = jwt.sign(
      {
        userId,
        path: resolvedPath,
        start: start || 0,
        audio: audio || 0,
        quality: quality || '0',
        bitrate: bitrate || 0,
      },
      jwtSecret,
      { expiresIn: (expiresIn ?? '2m') as jwt.SignOptions['expiresIn'] },
    );

    const params = new URLSearchParams({ token });
    const url = `/video-streaming/transcoded?${params.toString()}`;

    return ApiResponse.success(url, messages.success.fetch);
  }

  /**
   * Generate a JWT-signed URL for direct video streaming
   */
  @Post('passthrough-url')
  @Security('cookieAuth')
  public async getVideoUrl(
    @Body() body: VideoUrlDTO,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<string | null>> {
    const userId = (req as AuthenticatedRequest).user?.id as string;
    const { filePath, localId, expiresIn } = body;

    const path = await this.resolveVideoPath(filePath, localId, req);

    if (!path) {
      return ApiResponse.success(null, messages.success.fetch);
    }

    const token = jwt.sign(
      {
        userId,
        path,
      },
      getJwtSecret(),
      { expiresIn: (expiresIn ?? '2m') as jwt.SignOptions['expiresIn'] },
    );

    const params = new URLSearchParams({ token });
    const url = `/video-streaming/passthrough?${params.toString()}`;

    return ApiResponse.success(url, messages.success.fetch);
  }

  /**
   * Stream video with transcoding on the fly
   */
  @Get('transcoded')
  public async streamVideo(@Request() req: ExpressRequest): Promise<void> {
    const res = this.getStreamingResponse(req);

    // Apply video stream token verification middleware manually
    await new Promise<void>((resolve, reject) => {
      const middleware = verifyVideoStreamToken;
      middleware(req, res, (err?: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });

    videoProcessingService.transcodeAndStreamVideo((req as VideoParamsRequest).videoParams, res);
  }

  /**
   * Stream video file directly (passthrough) with range support
   */
  @Get('passthrough')
  public async streamVideoFile(@Request() req: ExpressRequest): Promise<void> {
    const res = this.getStreamingResponse(req);

    // Apply video stream token verification middleware manually
    await new Promise<void>((resolve, reject) => {
      const middleware = verifyVideoStreamToken;
      middleware(req, res, (err?: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });

    videoProcessingService.streamDirectVideoFile(req, res);
  }
}
