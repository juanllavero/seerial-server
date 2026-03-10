import type { Request as ExpressRequest } from 'express';
import { Controller, Get, Path, Request, Route, Security, Tags } from 'tsoa';
import type { Movie } from '@/api/v1/movies/domain/Movie';
import type { Series } from '@/api/v1/series/domain/Series';
import { myListRepo } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import { getUserId } from '@/utils/auth';

@Route('my-list')
@Tags('My List')
export class MyListController extends Controller {
  /**
   * Get movies from user's my list
   */
  @Get('movies')
  @Security('cookieAuth')
  public async getMyListMovies(@Request() req: ExpressRequest): Promise<ApiResponse<Movie[]>> {
    return ApiResponse.success(
      await myListRepo.getMoviesFromMyList(getUserId(req)),
      messages.success.fetch,
    );
  }

  /**
   * Get series from user's my list
   */
  @Get('series')
  @Security('cookieAuth')
  public async getMyListSeries(@Request() req: ExpressRequest): Promise<ApiResponse<Series[]>> {
    return ApiResponse.success(
      await myListRepo.getSeriesFromMyList(getUserId(req)),
      messages.success.fetch,
    );
  }

  /**
   * Check if a specific movie is in user's my list
   */
  @Get('movies/{id}/check')
  @Security('cookieAuth')
  public async isMovieInMyList(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<boolean>> {
    const userId = getUserId(req);
    return ApiResponse.success(
      await myListRepo.isMovieInMyList(id, userId),
      messages.success.fetch,
    );
  }

  /**
   * Check if a specific series is in user's my list
   */
  @Get('series/{id}/check')
  @Security('cookieAuth')
  public async isSeriesInMyList(
    @Path() id: string,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<boolean>> {
    const userId = getUserId(req);
    return ApiResponse.success(
      await myListRepo.isSeriesInMyList(id, userId),
      messages.success.fetch,
    );
  }
}
