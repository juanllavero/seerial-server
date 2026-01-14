import { MessageResponse } from "@/api/v0/shared/application/dtos/DTOs";
import {
  useCases,
  videoExtractionService,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
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
  SetWatchStateDTO,
  UpdateVideoDTO,
  VideoResponse,
} from "../../../application/dtos/VideoDTOs";

@Route("videos")
@Tags("Videos")
export class VideosController extends Controller {
  /**
   * Update video details
   */
  @Put("{id}")
  @Security("cookieAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateVideoDTO
  ): Promise<VideoResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

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
  @Security("cookieAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    await useCases.deleteVideo().execute(id);

    return { message: messages.success.delete };
  }

  /**
   * Update video media info
   */
  @Get("{id}/media-info")
  @Security("cookieAuth")
  public async updateMediaInfo(@Path() id: string): Promise<VideoResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

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
  @Security("cookieAuth")
  public async updateMediaInfoPut(@Path() id: string): Promise<VideoResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

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
  @Security("cookieAuth")
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetWatchStateDTO
  ): Promise<MessageResponse> {
    const { watched, userId } = body;

    if (!id || !userId) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

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
  @Security("cookieAuth")
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
  @Security("cookieAuth")
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
