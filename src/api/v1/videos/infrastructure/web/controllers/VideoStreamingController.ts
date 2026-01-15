import { videoProcessingService } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { verifyVideoStreamToken } from "@/middleware/video.middleware";
import { Request as ExpressRequest } from "express";
import jwt from "jsonwebtoken";
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  StreamUrlDTO,
  VideoUrlDTO,
} from "../../../application/dtos/VideoStreamingDTOs";

@Route("video-streaming")
@Tags("Video Streaming")
export class VideoStreamingController extends Controller {
  /**
   * Generate a JWT-signed URL for video streaming with transcoding
   */
  @Post("transcoded-url")
  @Security("cookieAuth")
  public async getStreamUrl(
    @Body() body: StreamUrlDTO,
    @Request() req: ExpressRequest
  ): Promise<string> {
    const userId = (req as any).user?.id;

    const { filePath, start, audio, quality, bitrate, expiresIn } = body;

    const token = jwt.sign(
      {
        userId,
        path: filePath,
        start: start || 0,
        audio: audio || 0,
        quality: quality || "0",
        bitrate: bitrate || 0,
      },
      process.env.JWT_SECRET!,
      { expiresIn: (expiresIn ?? "2m") as jwt.SignOptions["expiresIn"] }
    );

    const params = new URLSearchParams({ token });
    const url = `/stream-video?${params.toString()}`;

    return url;
  }

  /**
   * Generate a JWT-signed URL for direct video streaming
   */
  @Post("passthrough-url")
  @Security("cookieAuth")
  public async getVideoUrl(
    @Body() body: VideoUrlDTO,
    @Request() req: ExpressRequest
  ): Promise<string> {
    const userId = (req as any).user?.id;
    const { filePath, expiresIn } = body;

    const token = jwt.sign(
      {
        userId,
        path: filePath,
      },
      process.env.JWT_SECRET || "default-secret",
      { expiresIn: (expiresIn ?? "2m") as jwt.SignOptions["expiresIn"] }
    );

    const params = new URLSearchParams({ token });
    const url = `/video-file?${params.toString()}`;

    return url;
  }

  /**
   * Stream video with transcoding on the fly
   */
  @Get("transcoded")
  @Security("cookieAuth")
  public async streamVideo(@Request() req: ExpressRequest): Promise<void> {
    // Apply video stream token verification middleware manually
    await new Promise<void>((resolve, reject) => {
      const middleware = verifyVideoStreamToken;
      middleware(req, (this as any).response, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    videoProcessingService.transcodeAndStreamVideo(
      (req as any).videoParams,
      (this as any).response
    );
  }

  /**
   * Stream video file directly (passthrough) with range support
   */
  @Get("passthrough")
  @Security("cookieAuth")
  public async streamVideoFile(@Request() req: ExpressRequest): Promise<void> {
    // Apply video stream token verification middleware manually
    await new Promise<void>((resolve, reject) => {
      const middleware = verifyVideoStreamToken;
      middleware(req, (this as any).response, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    });

    videoProcessingService.streamDirectVideoFile(req, (this as any).response);
  }
}
