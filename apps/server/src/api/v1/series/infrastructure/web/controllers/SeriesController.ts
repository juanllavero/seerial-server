import type { Request as ExpressRequest } from 'express';
import type { TvEpisodeGroupsResponse, TvResult } from 'moviedb-promise';
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
} from 'tsoa';
import {
  externalSearchService,
  useCases,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { MediaService } from '@/api/v1/shared/infrastructure/services/MediaService';
import {
  BadRequestException,
  NotFoundException,
} from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import type { IncludeType } from '@/types/common';
import type {
  RefreshMetadataDTO,
  SetSeriesWatchStateDTO,
  UpdateEpisodeGroupDTO,
  UpdateSeriesDTO,
  UpdateShowIdDTO,
} from '@seerial/domain';
import type { Series } from '../../../domain/Series';

type AuthenticatedRequest = ExpressRequest & { user?: { id?: string } };

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
  @Patch('show/{id}')
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
  @Security('cookieAuth')
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetSeriesWatchStateDTO,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<null>> {
    const { watched, userId: bodyUserId } = body;
    const userId = (req as AuthenticatedRequest).user?.id ?? bodyUserId;

    if (!userId) {
      throw new BadRequestException(messages.errors.validation.notEnoughParams);
    }

    const series = await useCases.getSeriesById().execute(id);

    if (!series) {
      throw new NotFoundException(messages.errors.notFound.series);
    }

    for (const season of series.seasons) {
      await this.setSeasonWatchState(season.id, userId, watched);
    }

    await this.setSeriesWatchListState(id, userId, watched);
    await useCases.updateSeries().execute(series.id, series);

    return ApiResponse.success(null, messages.success.update);
  }

  private async setSeasonWatchState(
    seasonId: string,
    userId: string,
    watched: boolean,
  ): Promise<void> {
    const seasonWithEpisodes = await useCases.getSeasonById().execute(seasonId);
    if (!seasonWithEpisodes) return;

    for (const episode of seasonWithEpisodes.episodes) {
      const episodeDB = await useCases.getEpisodeById().execute(episode.id);
      if (!episodeDB) continue;

      const video = await useCases.getVideoByEpisodeId().execute(episodeDB.id);
      if (!video) continue;

      if (watched) {
        await useCases.addVideoToWatchList().execute(video.id, userId);
        await useCases.removeVideoFromContinueWatching().execute(video.id, userId);
      } else {
        await useCases.removeVideoFromWatchList().execute(video.id, userId);
      }

      await useCases.updateVideo().execute(video.id, video);
    }

    if (watched) {
      await useCases.addSeasonToWatchList().execute(seasonWithEpisodes.id, userId);
    } else {
      await useCases.removeSeasonFromWatchList().execute(seasonWithEpisodes.id, userId);
    }
    await useCases.updateSeason().execute(seasonWithEpisodes.id, seasonWithEpisodes);
  }

  private async setSeriesWatchListState(
    seriesId: string,
    userId: string,
    watched: boolean,
  ): Promise<void> {
    if (watched) {
      await useCases.addSeriesToWatchList().execute(seriesId, userId);
      return;
    }

    await useCases.removeSeriesFromWatchList().execute(seriesId, userId);
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
   * Get remaining episodes count for a series
   */
  @Get('{id}/remaining-episodes')
  @Security('adminAuth')
  public async getRemainingEpisodes(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<number>> {
    const userId = (req as AuthenticatedRequest).user?.id as string;
    const result = await MediaService.countRemainingEpisodes(id, userId);
    return ApiResponse.success(result, messages.success.fetch);
  }
}
