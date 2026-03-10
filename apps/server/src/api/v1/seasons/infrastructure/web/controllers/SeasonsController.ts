import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, Security, Tags } from 'tsoa';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import type { IncludeType } from '@/types/common';
import type { SetSeasonWatchStateDTO, UpdateSeasonDTO } from '../../../application/dtos/SeasonDTOs';
import type { Season } from '../../../domain/Season';

@Route('seasons')
@Tags('Seasons')
export class SeasonsController extends Controller {
  /**
   * Get season details by ID
   */
  @Get('{id}')
  @Security('cookieAuth')
  public async get(
    @Path() id: string,
    @Query() include?: IncludeType,
  ): Promise<ApiResponse<Season>> {
    const result = await useCases.getSeasonById().execute(id, include);

    if (!result) {
      throw new NotFoundException(messages.errors.notFound.season);
    }

    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Update season details
   */
  @Put('{id}')
  @Security('adminAuth')
  public async update(
    @Path() id: string,
    @Body() body: UpdateSeasonDTO,
  ): Promise<ApiResponse<Season>> {
    const result = await useCases.updateSeason().execute(id, body);
    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete a season
   */
  @Delete('{id}')
  @Security('adminAuth')
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteSeason().execute(id);
    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Set season watch state for a user
   */
  @Post('{id}/watch-state')
  @Security('adminAuth')
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetSeasonWatchStateDTO,
  ): Promise<ApiResponse<null>> {
    const { watched, userId } = body;

    const season = await useCases.getSeasonById().execute(id);

    if (!season) {
      throw new NotFoundException(messages.errors.notFound.season);
    }

    // Get first or last episode
    const episodeIndex = watched === true ? season.episodes.length - 1 : 0;
    const episode = season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber)[episodeIndex];

    // Set episode watched state
    await useCases.setEpisodeWatchState().execute(episode.id, userId, watched);

    return ApiResponse.success(null, messages.success.update);
  }
}
