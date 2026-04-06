import type { Request as ExpressRequest } from 'express';
import type { MovieResult } from 'moviedb-promise';
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
import type {
  ChangeIdentificationDTO,
  SetMovieWatchStateDTO,
  UpdateMovieDTO,
} from '../../../application/dtos/MovieDTOs';
import type { Movie } from '../../../domain/Movie';

type AuthenticatedRequest = ExpressRequest & { user?: { id?: string } };

@Route('movies')
@Tags('Movies')
export class MoviesController extends Controller {
  /**
   * Refresh movie metadata from external sources
   */
  @Post('{id}/metadata')
  @Security('adminAuth')
  public async refreshMovieMetadata(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.refreshMovieMetadata().execute(id);
    return ApiResponse.success(null, messages.success.update);
  }

  /**
   * Change movie identification (TMDB ID)
   */
  @Post('{id}/identification')
  @Security('adminAuth')
  public async changeIdentification(
    @Path() id: string,
    @Body() body: ChangeIdentificationDTO,
  ): Promise<ApiResponse<null>> {
    await useCases.updateMovieId().execute(id, body.themdbId);
    return ApiResponse.success(null, messages.success.update);
  }

  /**
   * Update movie details
   */
  @Put('{id}')
  @Security('adminAuth')
  public async update(
    @Path() id: string,
    @Body() body: UpdateMovieDTO,
  ): Promise<ApiResponse<Movie>> {
    const result = await useCases.updateMovie().execute(id, body);
    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete a movie
   */
  @Delete('{id}')
  @Security('adminAuth')
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteMovie().execute(id);
    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Set movie watch state for a user
   */
  @Post('{id}/watch-state')
  @Security('cookieAuth')
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetMovieWatchStateDTO,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<null>> {
    const userId = (req as AuthenticatedRequest).user?.id as string;
    const { watched } = body;

    const movie = await useCases.getMoviebyId().execute(id);

    if (!movie) {
      throw new NotFoundException(messages.errors.notFound.movie);
    }

    if (watched) {
      await useCases.addMovieToWatchList().execute(id, userId);
    } else {
      await useCases.removeMovieFromWatchList().execute(id, userId);
    }
    await useCases.updateMovie().execute(movie.id, movie);

    // Manage continue watching for all movie videos
    for (const video of movie.videos) {
      if (
        watched === false &&
        video.watchLists.filter((wl) => wl.id === userId).length > 0 &&
        (video.watchLists.filter((wl) => wl.id === userId)[0]?.timeWatched ?? 0) > 0
      ) {
        await useCases.addVideoToContinueWatching().execute(video.id, userId);
      } else if (watched === true) {
        await useCases.removeVideoFromContinueWatching().execute(video.id, userId);
      }
    }

    return ApiResponse.success(null, messages.success.update);
  }

  /**
   * Get movie by ID
   */
  @Get('{id}')
  @Security('cookieAuth')
  public async get(@Path() id: string): Promise<ApiResponse<Movie>> {
    const movie = await useCases.getMoviebyId().execute(id);

    if (!movie) {
      throw new NotFoundException(messages.errors.notFound.movie);
    }

    return ApiResponse.success(movie, messages.success.fetch);
  }

  /**
   * Search movies in TMDB
   */
  @Get('search')
  @Security('adminAuth')
  public async searchMovies(
    @Query() name: string,
    @Query() year?: string,
  ): Promise<ApiResponse<MovieResult[]>> {
    const result = await externalSearchService.searchMovies(name, year);
    return ApiResponse.success(result, messages.success.fetch);
  }

  /**
   * Get IMDB score for a movie
   */
  @Get('imdb-score')
  @Security('adminAuth')
  public async getImdbScore(@Query() id: string): Promise<ApiResponse<number>> {
    const score = await externalSearchService.getImdbScore(id);
    return ApiResponse.success(score, messages.success.fetch);
  }

  /**
   * Get remaining videos count for a movie
   */
  @Get('{id}/remaining-videos')
  @Security('adminAuth')
  public async getRemainingVideos(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<number>> {
    const userId = (req as AuthenticatedRequest).user?.id as string;
    const count = await MediaService.countRemainingVideos(id, userId);

    return ApiResponse.success(count, messages.success.fetch);
  }
}
