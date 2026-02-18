import { HTTPCodes } from "@/api/v1/shared/domain/types/HTTPCodes";
import {
  episodesRepo,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { ApiResponse } from "@/api/v1/shared/infrastructure/web/http/APIResponse";
import { messages } from "@/config/messages";
import { Request as ExpressRequest } from "express";
import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Request,
  Response,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  SetEpisodeWatchStateDTO,
  UpdateEpisodeDTO,
} from "../../../application/dtos/EpisodeDTOs";
import { Episode } from "../../../domain/Episode";

@Route("episodes")
@Tags("Episodes")
export class EpisodesController extends Controller {
  /**
   * Get episode by ID
   */
  @Get("{id}")
  @Security("cookieAuth")
  public async get(@Path() id: string): Promise<ApiResponse<Episode | null>> {
    const episode = await episodesRepo.findById(id);
    return ApiResponse.success(episode, messages.success.fetch);
  }

  /**
   * Update episode details
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateEpisodeDTO
  ): Promise<ApiResponse<Episode>> {
    const result = await useCases.updateEpisode().execute(id, body);

    return ApiResponse.success(result, messages.success.update);
  }

  /**
   * Delete an episode
   */
  @Delete("{id}")
  @Security("adminAuth")
  @Response<ApiResponse<null>>(
    HTTPCodes.VALIDATION_ERROR,
    messages.errors.validation.invalidData
  )
  public async delete(@Path() id: string): Promise<ApiResponse<null>> {
    await useCases.deleteEpisode().execute(id);

    return ApiResponse.success(null, messages.success.delete);
  }

  /**
   * Set episode watch state for a user
   */
  @Post("{id}/watch-state")
  @Security("adminAuth")
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetEpisodeWatchStateDTO,
    @Request() req: ExpressRequest
  ): Promise<ApiResponse<null>> {
    const { state } = body;
    const userId = (req as any).user?.id;

    await useCases.setEpisodeWatchState().execute(id, userId, state);

    return ApiResponse.success(null, messages.success.update);
  }
}
