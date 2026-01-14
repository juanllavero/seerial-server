import { MessageResponse } from "@/api/v0/shared/application/dtos/DTOs";
import {
  continueWatchingRepo,
  episodesRepo,
  seasonsRepo,
  seriesRepo,
  videosRepo,
  watchListRepo,
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
  EpisodeResponse,
  SetWatchStateDTO,
  UpdateEpisodeDTO,
} from "../../../application/dtos/EpisodeDTOs";
import { DeleteEpisodeUseCase } from "../../../application/usecases/DeleteEpisodeUseCase";
import { SetEpisodeWatchStateUseCase } from "../../../application/usecases/SetEpisodeWatchStateUseCase";
import { UpdateEpisodeUseCase } from "../../../application/usecases/UpdateEpisodeUseCase";

@Route("episodes")
@Tags("Episodes")
export class EpisodesController extends Controller {
  /**
   * Update episode details
   */
  @Put("{id}")
  @Security("cookieAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateEpisodeDTO
  ): Promise<EpisodeResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const useCase = new UpdateEpisodeUseCase(episodesRepo);
    const result = await useCase.execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete an episode
   */
  @Delete("{id}")
  @Security("cookieAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const useCase = new DeleteEpisodeUseCase(episodesRepo);
    await useCase.execute(id);

    return { message: messages.success.delete };
  }

  /**
   * Set episode watch state for a user
   */
  @Post("{id}/watch-state")
  @Security("cookieAuth")
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetWatchStateDTO,
    @Request() req: ExpressRequest
  ): Promise<EpisodeResponse> {
    const { state } = body;
    const userId = (req as any).user?.id;

    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }
    if (typeof state !== "boolean") {
      throw new ApiError(400, messages.errors.validation.invalidData);
    }
    if (!userId) {
      throw new ApiError(401, messages.errors.token.missing);
    }

    const useCase = new SetEpisodeWatchStateUseCase(
      episodesRepo,
      seasonsRepo,
      seriesRepo,
      videosRepo,
      watchListRepo,
      continueWatchingRepo
    );

    await useCase.execute(id, userId, state);

    return {
      status: "success",
      message: `Episode watch state updated to ${state}`,
    };
  }
}
