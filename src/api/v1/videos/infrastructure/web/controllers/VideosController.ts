import { MessageResponse } from "@/api/v1/shared/application/dtos/DTOs";
import {
  useCases,
  videoExtractionService,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Query,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  SetVideoWatchStateDTO,
  UpdateVideoDTO,
  VideoResponse,
} from "../../../application/dtos/VideoDTOs";

@Route("videos")
@Tags("Videos")
export class VideosController extends Controller {
  /**
   * Get video details by ID
   */
  @Get("{id}")
  @Security("cookieAuth")
  public async get(@Path() id: string): Promise<VideoResponse> {
    const result = await useCases.getVideoById().execute(id);

    if (!result) {
      throw new ApiError(404, messages.errors.notFound.video);
    }

    return {
      status: "success",
      message: messages.success.fetch,
      data: result,
    };
  }

  /**
   * Update video details
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateVideoDTO
  ): Promise<VideoResponse> {
    const result = await useCases.updateVideo().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete a video
   */
  @Delete("{id}")
  @Security("adminAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    await useCases.deleteVideo().execute(id);
    return { message: messages.success.delete };
  }

  /**
   * Update video media info
   */
  @Get("{id}/media-info")
  @Security("adminAuth")
  public async updateMediaInfo(@Path() id: string): Promise<VideoResponse> {
    const result = await useCases.updateMediaInfo().execute(id);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Update video media info (PUT)
   */
  @Put("{id}/media-info")
  @Security("adminAuth")
  public async updateMediaInfoPut(@Path() id: string): Promise<VideoResponse> {
    const result = await useCases.updateMediaInfo().execute(id);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Set video watch state for a user
   */
  @Post("{id}/watch-state")
  @Security("adminAuth")
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetVideoWatchStateDTO
  ): Promise<MessageResponse> {
    const { watched, userId } = body;

    const video = await useCases.getVideoById().execute(id);

    if (!video) {
      throw new ApiError(404, messages.errors.notFound.video);
    }

    if (watched) {
      await useCases.addVideoToWatchList().execute(id, userId);
    } else {
      await useCases.removeVideoFromWatchList().execute(id, userId);
    }
    await useCases.updateVideo().execute(video.id, video);

    return { message: messages.success.update };
  }

  /**
   * Extract video thumbnail
   */
  @Get("thumbnail")
  @Security("adminAuth")
  public async getVideoThumbnail(
    @Query() url: string,
    @Query() time?: string
  ): Promise<void> {
    await videoExtractionService.streamVideoThumbnail(
      url,
      time || "10",
      (this as any).response
    );
  }

  /**
   * Extract subtitle track from video
   */
  @Get("subtitles")
  @Security("adminAuth")
  public async getSubsFromVideo(
    @Query() videoPathParam: string,
    @Query() trackId: number,
    @Query() startTime?: number
  ): Promise<void> {
    await videoExtractionService.streamVideoSubtitles(
      videoPathParam,
      trackId,
      startTime || 0,
      (this as any).response
    );
  }
}
