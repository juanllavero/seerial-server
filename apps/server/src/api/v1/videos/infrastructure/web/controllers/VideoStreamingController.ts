import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import jwt from 'jsonwebtoken';
import { Body, Controller, Get, Post, Request, Route, Security, Tags } from 'tsoa';
import { videoProcessingService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import { verifyVideoStreamToken } from '@/middleware/video.middleware';
import type { StreamUrlDTO, VideoUrlDTO } from '../../../application/dtos/VideoStreamingDTOs';
import type { TranscodeVideoParams } from '../../../application/ports/VideoProcessingServicePort';

type AuthenticatedRequest = ExpressRequest & { user?: { id?: string } };
type TsoaContext = { response: ExpressResponse };
type VideoParamsRequest = ExpressRequest & { videoParams: TranscodeVideoParams };

@Route('video-streaming')
@Tags('Video Streaming')
export class VideoStreamingController extends Controller {
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

    const jwtSecret = process.env.JWT_SECRET || 'default-secret';
    const token = jwt.sign(
      {
        userId,
        path: filePath,
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
  ): Promise<ApiResponse<string>> {
    const userId = (req as AuthenticatedRequest).user?.id as string;
    const { filePath, expiresIn } = body;

    const token = jwt.sign(
      {
        userId,
        path: filePath,
      },
      process.env.JWT_SECRET || 'default-secret',
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
    // Apply video stream token verification middleware manually
    await new Promise<void>((resolve, reject) => {
      const middleware = verifyVideoStreamToken;
      middleware(req, (this as unknown as TsoaContext).response, (err?: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });

    videoProcessingService.transcodeAndStreamVideo(
      (req as VideoParamsRequest).videoParams,
      (this as unknown as TsoaContext).response,
    );
  }

  /**
   * Stream video file directly (passthrough) with range support
   */
  @Get('passthrough')
  public async streamVideoFile(@Request() req: ExpressRequest): Promise<void> {
    // Apply video stream token verification middleware manually
    await new Promise<void>((resolve, reject) => {
      const middleware = verifyVideoStreamToken;
      middleware(req, (this as unknown as TsoaContext).response, (err?: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });

    videoProcessingService.streamDirectVideoFile(req, (this as unknown as TsoaContext).response);
  }
}
