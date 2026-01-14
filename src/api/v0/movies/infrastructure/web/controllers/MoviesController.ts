import { MessageResponse } from "@/api/v0/episodes/application/dtos/EpisodeDTOs";
import {
  librariesRepo,
  moviesRepo,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Delete,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  ChangeIdentificationDTO,
  MovieResponse,
  SetWatchStateDTO,
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
    if (!id) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

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
    if (!id || !body.themdbId) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

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
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

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
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

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
    @Body() body: SetWatchStateDTO,
    @Request() req: ExpressRequest
  ): Promise<MessageResponse> {
    const userId = (req as any).user?.id;
    const { watched } = body;

    if (!id || !userId) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

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
}
