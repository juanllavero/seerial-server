import { MessageResponse } from "@/api/v1/shared/application/dtos/DTOs";
import {
  librariesRepo,
  moviesRepo,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { ExternalSearchManager } from "@/managers/ExternalSearchManager";
import { MediaManager } from "@/managers/MediaManager";
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
  ChangeIdentificationDTO,
  MovieResponse,
  SetMovieWatchStateDTO,
  UpdateMovieDTO,
} from "../../../application/dtos/MovieDTOs";
import { DeleteMovieUseCase } from "../../../application/usecases/DeleteMovieUseCase";
import { RefreshMovieMetadataUseCase } from "../../../application/usecases/RefreshMovieMetadataUseCase";
import { UpdateMovieIdUseCase } from "../../../application/usecases/UpdateMovieIdUseCase";
import { UpdateMovieUseCase } from "../../../application/usecases/UpdateMoviesUseCase";

@Route("movies")
@Tags("Movies")
export class MoviesController extends Controller {
  /**
   * Refresh movie metadata from external sources
   */
  @Post("{id}/metadata")
  @Security("cookieAuth")
  public async refreshMovieMetadata(
    @Path() id: string
  ): Promise<MessageResponse> {
    const useCase = new RefreshMovieMetadataUseCase();
    await useCase.execute(id);

    return { message: messages.success.update };
  }

  /**
   * Change movie identification (TMDB ID)
   */
  @Post("{id}/identification")
  @Security("cookieAuth")
  public async changeIdentification(
    @Path() id: string,
    @Body() body: ChangeIdentificationDTO
  ): Promise<MessageResponse> {
    const useCase = new UpdateMovieIdUseCase();
    await useCase.execute(id, body.themdbId);

    return { message: messages.success.update };
  }

  /**
   * Update movie details
   */
  @Put("{id}")
  @Security("cookieAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateMovieDTO
  ): Promise<MovieResponse> {
    const useCase = new UpdateMovieUseCase(moviesRepo);
    const result = await useCase.execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete a movie
   */
  @Delete("{id}")
  @Security("cookieAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    const useCase = new DeleteMovieUseCase(librariesRepo, moviesRepo);
    await useCase.execute(id);

    return { message: messages.success.delete };
  }

  /**
   * Set movie watch state for a user
   */
  @Post("{id}/watch-state")
  @Security("cookieAuth")
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetMovieWatchStateDTO,
    @Request() req: ExpressRequest
  ): Promise<MessageResponse> {
    const userId = (req as any).user?.id;
    const { watched } = body;

    const movie = await useCases.getMoviebyId().execute(id);

    if (!movie) {
      throw new ApiError(404, messages.errors.notFound.movie);
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
        (video.watchLists.filter((wl) => wl.id === userId)[0]?.timeWatched ??
          0) > 0
      ) {
        await useCases.addVideoToContinueWatching().execute(video.id, userId);
      } else if (watched === true) {
        await useCases
          .removeVideoFromContinueWatching()
          .execute(video.id, userId);
      }
    }

    return { message: messages.success.update };
  }

  /**
   * Search movies in TMDB
   */
  @Get("search")
  @Security("cookieAuth")
  public async searchMovies(
    @Query() name: string,
    @Query() year?: string
  ): Promise<any> {
    return await ExternalSearchManager.searchMovies(name, year);
  }

  /**
   * Get IMDB score for a movie
   */
  @Get("imdb-score")
  @Security("cookieAuth")
  public async getImdbScore(@Query() id: string): Promise<any> {
    return await ExternalSearchManager.getImdbScore(id);
  }

  /**
   * Get remaining videos count for a movie
   */
  @Get("{id}/remaining-videos")
  @Security("cookieAuth")
  public async getRemainingVideos(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = (req as any).user?.id;
    return await MediaManager.countRemainingVideos(id, userId);
  }

  /**
   * Check if movie is in user's my list
   */
  @Get("{id}/my-list")
  @Security("cookieAuth")
  public async isMovieInMyList(
    @Path() id: string,
    @Request() req: ExpressRequest
  ): Promise<any> {
    const userId = (req as any).user?.id;
    return await MediaManager.isMovieInMyList(id, userId);
  }
}
