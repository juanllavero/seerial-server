import { myListRepo } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MediaManager } from "@/managers/MediaManager";
import { getUserId } from "@/utils/auth";
import { Request as ExpressRequest } from "express";
import { Controller, Get, Path, Request, Route, Security, Tags } from "tsoa";

@Route("my-list")
@Tags("My List")
export class MyListController extends Controller {
  /**
   * Get movies from user's my list
   */
  @Get("movies")
  @Security("cookieAuth")
  public async getMyListMovies(@Request() req: ExpressRequest): Promise<any[]> {
    return myListRepo.getMoviesFromMyList(getUserId(req));
  }

  /**
   * Get series from user's my list
   */
  @Get("series")
  @Security("cookieAuth")
  public async getMyListSeries(@Request() req: ExpressRequest): Promise<any[]> {
    return myListRepo.getSeriesFromMyList(getUserId(req));
  }

  /**
   * Check if a specific movie is in user's my list
   */
  @Get("movies/{id}/check")
  @Security("cookieAuth")
  public async isMovieInMyList(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = getUserId(req);

    if (!id || !userId) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    return await MediaManager.isMovieInMyList(id, userId);
  }

  /**
   * Check if a specific series is in user's my list
   */
  @Get("series/{id}/check")
  @Security("cookieAuth")
  public async isSeriesInMyList(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = getUserId(req);

    if (!id || !userId) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    return await MediaManager.isSeriesInMyList(id, userId);
  }
}
