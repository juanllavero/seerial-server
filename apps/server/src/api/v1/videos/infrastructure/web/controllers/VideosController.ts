import type { PlayBackInfo, Video } from "@seerial/domain";
import type {
	Request as ExpressRequest,
	Response as ExpressResponse,
} from "express";
import {
	Body,
	Controller,
	Delete,
	Get,
	Patch,
	Path,
	Post,
	Query,
	Request,
	Route,
	Security,
	Tags,
} from "tsoa";
import {
	useCases,
	videoExtractionService,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import {
	BadRequestException,
	NotFoundException,
} from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { ApiResponse } from "@/api/v1/shared/infrastructure/web/http/APIResponse";
import { messages } from "@/config/messages";
import type {
	SetVideoWatchStateDTO,
	UpdateVideoDTO,
} from "../../../application/dtos/VideoDTOs";

type TsoaContext = { response: ExpressResponse };
type AuthenticatedRequest = ExpressRequest & { user?: { id?: string } };

@Route("videos")
@Tags("Videos")
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
	 * Get video info for playback (including media info and playback preferences)
	 */
	@Get('playback-info/{id}')
  @Security('cookieAuth')
  public async getPlaybackInfo(@Path() id: string): Promise<ApiResponse<PlayBackInfo>> {
    const result = await useCases.getVideoPlaybackInfo().execute(id);

    if (!result) {
      throw new NotFoundException(messages.errors.notFound.video);
    }

    return ApiResponse.success(result, messages.success.fetch);
  }

	/**
	 * Update video details
	 */
	@Patch("{id}")
	@Security("adminAuth")
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
    const _result = await useCases.updateMediaInfo().execute(id);
    return ApiResponse.success(null, messages.success.update);
  }

	/**
	 * Set video watch state for a user
	 */
	@Post("{id}/watch-state")
	@Security("cookieAuth")
	public async setWatchState(
		@Path() id: string,
		@Body() body: SetVideoWatchStateDTO,
		@Request() req: ExpressRequest,
	): Promise<ApiResponse<null>> {
		const { watched, userId: bodyUserId } = body;
		const userId = (req as AuthenticatedRequest).user?.id ?? bodyUserId;

		if (!userId) {
			throw new BadRequestException(messages.errors.validation.notEnoughParams);
		}

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
	@Get("thumbnail")
	@Security("adminAuth")
	public async getVideoThumbnail(
		@Query() url: string,
		@Query() time?: string,
	): Promise<void> {
		await videoExtractionService.streamVideoThumbnail(
			url,
			time || "10",
			(this as unknown as TsoaContext).response,
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
		@Query() startTime?: number,
	): Promise<void> {
		await videoExtractionService.streamVideoSubtitles(
			videoPathParam,
			trackId,
			startTime || 0,
			(this as unknown as TsoaContext).response,
		);
	}
}
