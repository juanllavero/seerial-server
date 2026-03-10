import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import {
  useCases,
  videoExtractionService,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import type { SetVideoWatchStateDTO, UpdateVideoDTO } from '../../../application/dtos/VideoDTOs';
import type { Video } from '../../../domain/Video';

@Route('videos')
@Tags('Videos')
export class VideosController extends Controller {
  /**
   * Get video details by ID
   */
  @Get('{id}')
  @Security('cookieAuth')
  public async get(@Path() id: string): Promise<ApiResponse<Video>> {
    const result = await useCases.getVideoById().execute(id);

    if (!result) {
      throw new NotFoundException(messages.errors.notFound.video);
    }

    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Get video by episode ID
   */
  @Get('by-episode/{episodeId}')
  @Security('cookieAuth')
  public async getByEpisodeId(@Path() episodeId: string): Promise<ApiResponse<Video>> {
    const result = await useCases.getVideoByEpisodeId().execute(episodeId);

    if (!result) {
      throw new NotFoundException(messages.errors.notFound.video);
    }

    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Update video details
   */
  @Put('{id}')
  @Security('adminAuth')
  public async update(
    @Path() id: string,
    @Body() body: UpdateVideoDTO,
  ): Promise<ApiResponse<Video>> {
    const result = await useCases.updateVideo().execute(id, body);
    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete a video
   */
  @Delete('{id}')
  @Security('adminAuth')
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteVideo().execute(id);
    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Update video media info
   */
  @Get('{id}/media-info')
  @Security('adminAuth')
  public async updateMediaInfo(@Path() id: string): Promise<ApiResponse<null>> {
    const result = await useCases.updateMediaInfo().execute(id);
    return ApiResponse.success(null, messages.success.update);
  }

  /**
   * Update video media info (PUT)
   */
  @Put('{id}/media-info')
  @Security('adminAuth')
  public async updateMediaInfoPut(@Path() id: string): Promise<ApiResponse<null>> {
    const result = await useCases.updateMediaInfo().execute(id);
    return ApiResponse.success(null, messages.success.update);
  }

  /**
   * Set video watch state for a user
   */
  @Post('{id}/watch-state')
  @Security('adminAuth')
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetVideoWatchStateDTO,
  ): Promise<ApiResponse<null>> {
    const { watched, userId } = body;

    const video = await useCases.getVideoById().execute(id);

    if (!video) {
      throw new NotFoundException(messages.errors.notFound.video);
    }

    if (watched) {
      await useCases.addVideoToWatchList().execute(id, userId);
    } else {
      await useCases.removeVideoFromWatchList().execute(id, userId);
    }
    await useCases.updateVideo().execute(video.id, video);

    return ApiResponse.success(null, messages.success.update);
  }

  /**
   * Extract video thumbnail
   */
  @Get('thumbnail')
  @Security('adminAuth')
  public async getVideoThumbnail(@Query() url: string, @Query() time?: string): Promise<void> {
    await videoExtractionService.streamVideoThumbnail(url, time || '10', (this as any).response);
  }

  /**
   * Extract subtitle track from video
   */
  @Get('subtitles')
  @Security('adminAuth')
  public async getSubsFromVideo(
    @Query() videoPathParam: string,
    @Query() trackId: number,
    @Query() startTime?: number,
  ): Promise<void> {
    await videoExtractionService.streamVideoSubtitles(
      videoPathParam,
      trackId,
      startTime || 0,
      (this as any).response,
    );
  }
}
