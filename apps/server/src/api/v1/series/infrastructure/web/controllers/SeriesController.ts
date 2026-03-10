import type { Request as ExpressRequest } from 'express';
import type { TvEpisodeGroupsResponse, TvResult } from 'moviedb-promise';
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
} from 'tsoa';
import {
  externalSearchService,
  useCases,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { MediaService } from '@/api/v1/shared/infrastructure/services/MediaService';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import type { IncludeType } from '@/types/common';
import type {
  RefreshMetadataDTO,
  SetSeriesWatchStateDTO,
  UpdateEpisodeGroupDTO,
  UpdateSeriesDTO,
  UpdateShowIdDTO,
} from '../../../application/dtos/SeriesDTOs';
import type { Series } from '../../../domain/Series';

@Route('series')
@Tags('Series')
export class SeriesController extends Controller {
  /**
   * Refresh series metadata from external sources
   */
  @Post('metadata')
  @Security('adminAuth')
  public async refreshMetadata(@Body() body: RefreshMetadataDTO): Promise<ApiResponse<null>> {
    const { id } = body;

    await useCases.refreshSeriesMetadata().execute(id);
    return ApiResponse.success(null, messages.success.update);
  }

  /**
   * Update series TMDB ID
   */
  @Post('tmdb-id')
  @Security('adminAuth')
  public async updateShowId(@Body() body: UpdateShowIdDTO): Promise<ApiResponse<null>> {
    const { id, themdbId } = body;

    await useCases.updateShowId().execute(id, themdbId);
    return ApiResponse.success(null, messages.success.update);
  }

  /**
   * Update series episode group
   */
  @Post('{id}/episode-group')
  @Security('adminAuth')
  public async updateEpisodeGroup(
    @Path() id: string,
    @Body() body: UpdateEpisodeGroupDTO,
  ): Promise<ApiResponse<null>> {
    const { themdbId, episodeGroupId } = body;

    await useCases.updateEpisodeGroup().execute(id, themdbId, episodeGroupId);
    return ApiResponse.success(null, messages.success.update);
  }

  /**
   * Update series details
   */
  @Put('show/{id}')
  @Security('adminAuth')
  public async update(
    @Path() id: string,
    @Body() body: UpdateSeriesDTO,
  ): Promise<ApiResponse<Series>> {
    const result = await useCases.updateSeries().execute(id, body);
    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete a series
   */
  @Delete('{id}')
  @Security('adminAuth')
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteSeries().execute(id);
    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Set series watch state for a user
   */
  @Post('{id}/watch-state')
  @Security('adminAuth')
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetSeriesWatchStateDTO,
  ): Promise<ApiResponse<null>> {
    const { watched, userId } = body;

    const series = await useCases.getSeriesById().execute(id);

    if (!series) {
      throw new NotFoundException(messages.errors.notFound.series);
    }

    for (const season of series.seasons) {
      const seasonWithEpisodes = await useCases.getSeasonById().execute(season.id);

      if (!seasonWithEpisodes) continue;

      for (const episode of seasonWithEpisodes.episodes) {
        const episodeDB = await useCases.getEpisodeById().execute(episode.id);

        if (!episodeDB) continue;

        const video = await useCases.getVideoByEpisodeId().execute(episodeDB.id);

        if (!video) continue;

        if (watched) {
          await useCases.addVideoToWatchList().execute(video.id, userId);
        } else {
          await useCases.removeVideoFromWatchList().execute(video.id, userId);
        }
        await useCases.updateVideo().execute(video.id, video);

        // Manage continue watching
        if (watched === true) {
          await useCases.removeVideoFromContinueWatching().execute(video.id, userId);
        }
      }

      if (watched) {
        await useCases.addSeasonToWatchList().execute(seasonWithEpisodes.id, userId);
      } else {
        await useCases.removeSeasonFromWatchList().execute(seasonWithEpisodes.id, userId);
      }
      await useCases.updateSeason().execute(seasonWithEpisodes.id, seasonWithEpisodes);
    }

    if (watched) {
      await useCases.addSeriesToWatchList().execute(id, userId);
    } else {
      await useCases.removeSeriesFromWatchList().execute(id, userId);
    }
    await useCases.updateSeries().execute(series.id, series);

    return ApiResponse.success(null, messages.success.update);
  }

  /**
   * Get series by ID
   */
  @Get('{id}')
  @Security('cookieAuth')
  public async get(
    @Path() id: string,
    @Query() include?: IncludeType,
  ): Promise<ApiResponse<Series>> {
    const series = await useCases.getSeriesById().execute(id, include);

    if (!series) {
      throw new NotFoundException(messages.errors.notFound.series);
    }

    return ApiResponse.success(series, messages.success.fetch);
  }

  /**
   * Search series in TMDB
   */
  @Get('search')
  @Security('adminAuth')
  public async searchSeries(
    @Query() name: string,
    @Query() year?: string,
  ): Promise<ApiResponse<TvResult[]>> {
    const result = await externalSearchService.searchTvShows(name, year);
    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Search episode groups in TMDB
   */
  @Get('episode-groups/search')
  @Security('adminAuth')
  public async searchEpisodeGroups(
    @Query() id: string,
  ): Promise<ApiResponse<TvEpisodeGroupsResponse | null>> {
    const result = await externalSearchService.searchEpisodeGroups(id);
    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Get remaining episodes count for a series
   */
  @Get('{id}/remaining-episodes')
  @Security('adminAuth')
  public async getRemainingEpisodes(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<number>> {
    const userId = (req as any).user?.id;
    const result = await MediaService.countRemainingEpisodes(id, userId);
    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Check if series is in user's my list
   */
  @Get('{id}/my-list')
  @Security('adminAuth')
  public async isSeriesInMyList(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<boolean>> {
    const userId = (req as any).user?.id;
    const result = await useCases.isSeriesInMyList().execute(id, userId);
    return ApiResponse.success(result, messages.success.fetch);
  }
}
