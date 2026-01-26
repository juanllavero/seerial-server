import { MessageResponse } from "@/api/v1/shared/application/dtos/DTOs";
import {
  externalSearchService,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { MediaService } from "@/api/v1/shared/infrastructure/services/MediaService";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { IncludeType } from "@/types/common";
import { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  RefreshMetadataDTO,
  SeriesResponse,
  SetSeriesWatchStateDTO,
  UpdateEpisodeGroupDTO,
  UpdateSeriesDTO,
  UpdateShowIdDTO,
} from "../../../application/dtos/SeriesDTOs";

@Route("series")
@Tags("Series")
export class SeriesController extends Controller {
  /**
   * Refresh series metadata from external sources
   */
  @Post("metadata")
  @Security("adminAuth")
  public async refreshMetadata(
    @Body() body: RefreshMetadataDTO
  ): Promise<SeriesResponse> {
    const { id } = body;

    await useCases.refreshMetadata().execute(id);

    return {
      status: "success",
      message: messages.success.update,
    };
  }

  /**
   * Update series TMDB ID
   */
  @Post("tmdb-id")
  @Security("adminAuth")
  public async updateShowId(
    @Body() body: UpdateShowIdDTO
  ): Promise<SeriesResponse> {
    const { id, themdbId } = body;

    await useCases.updateShowId().execute(id, themdbId);

    return {
      status: "success",
      message: messages.success.update,
    };
  }

  /**
   * Update series episode group
   */
  @Post("{id}/episode-group")
  @Security("adminAuth")
  public async updateEpisodeGroup(
    @Path() id: string,
    @Body() body: UpdateEpisodeGroupDTO
  ): Promise<SeriesResponse> {
    const { themdbId, episodeGroupId } = body;

    await useCases.updateEpisodeGroup().execute(id, themdbId, episodeGroupId);

    return {
      status: "success",
      message: messages.success.update,
    };
  }

  /**
   * Update series details
   */
  @Put("show/{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateSeriesDTO
  ): Promise<SeriesResponse> {
    const result = await useCases.updateSeries().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete a series
   */
  @Delete("{id}")
  @Security("adminAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    await useCases.deleteSeries().execute(id);
    return { message: messages.success.delete };
  }

  /**
   * Set series watch state for a user
   */
  @Post("{id}/watch-state")
  @Security("adminAuth")
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetSeriesWatchStateDTO
  ): Promise<MessageResponse> {
    const { watched, userId } = body;

    const series = await useCases.getSeriesById().execute(id);

    if (!series) {
      throw new ApiError(404, messages.errors.notFound.series);
    }

    for (const season of series.seasons) {
      const seasonWithEpisodes = await useCases
        .getSeasonById()
        .execute(season.id);

      if (!seasonWithEpisodes) continue;

      for (const episode of seasonWithEpisodes.episodes) {
        const episodeDB = await useCases.getEpisodeById().execute(episode.id);

        if (!episodeDB) continue;

        const video = await useCases
          .getVideoByEpisodeId()
          .execute(episodeDB.id);

        if (!video) continue;

        if (watched) {
          await useCases.addVideoToWatchList().execute(video.id, userId);
        } else {
          await useCases.removeVideoFromWatchList().execute(video.id, userId);
        }
        await useCases.updateVideo().execute(video.id, video);

        // Manage continue watching
        if (watched === true) {
          await useCases
            .removeVideoFromContinueWatching()
            .execute(video.id, userId);
        }
      }

      if (watched) {
        await useCases
          .addSeasonToWatchList()
          .execute(seasonWithEpisodes.id, userId);
      } else {
        await useCases
          .removeSeasonFromWatchList()
          .execute(seasonWithEpisodes.id, userId);
      }
      await useCases
        .updateSeason()
        .execute(seasonWithEpisodes.id, seasonWithEpisodes);
    }

    if (watched) {
      await useCases.addSeriesToWatchList().execute(id, userId);
    } else {
      await useCases.removeSeriesFromWatchList().execute(id, userId);
    }
    await useCases.updateSeries().execute(series.id, series);

    return { message: messages.success.update };
  }

  /**
   * Get series by ID
   */
  @Get("{id}")
  @Security("cookieAuth")
  public async get(
    @Path() id: string,
    @Query() include?: IncludeType
  ): Promise<SeriesResponse> {
    const series = await useCases.getSeriesById().execute(id, include);

    if (!series) {
      throw new ApiError(404, messages.errors.notFound.series);
    }

    return {
      status: "success",
      message: messages.success.fetch,
      data: series,
    };
  }

  /**
   * Search series in TMDB
   */
  @Get("search")
  @Security("adminAuth")
  public async searchSeries(
    @Query() name: string,
    @Query() year?: string
  ): Promise<any> {
    return await externalSearchService.searchTvShows(name, year);
  }

  /**
   * Search episode groups in TMDB
   */
  @Get("episode-groups/search")
  @Security("adminAuth")
  public async searchEpisodeGroups(@Query() id: string): Promise<any> {
    return await externalSearchService.searchEpisodeGroups(id);
  }

  /**
   * Get remaining episodes count for a series
   */
  @Get("{id}/remaining-episodes")
  @Security("adminAuth")
  public async getRemainingEpisodes(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = (req as any).user?.id;
    return await MediaService.countRemainingEpisodes(id, userId);
  }

  /**
   * Check if series is in user's my list
   */
  @Get("{id}/my-list")
  @Security("adminAuth")
  public async isSeriesInMyList(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = (req as any).user?.id;
    return await MediaService.isSeriesInMyList(id, userId);
  }
}
