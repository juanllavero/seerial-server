import { MessageResponse } from "@/api/v0/shared/application/dtos/DTOs";
import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import {
  Body,
  Controller,
  Delete,
  Path,
  Post,
  Put,
  Route,
  Security,
  Tags,
} from "tsoa";
import {
  SeasonResponse,
  SetWatchStateDTO,
  UpdateSeasonDTO,
} from "../../../application/dtos/SeasonDTOs";

@Route("seasons")
@Tags("Seasons")
export class SeasonsController extends Controller {
  /**
   * Update season details
   */
  @Put("{id}")
  @Security("cookieAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateSeasonDTO
  ): Promise<SeasonResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    const result = await useCases.updateSeason().execute(id, body);

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }

  /**
   * Delete a season
   */
  @Delete("{id}")
  @Security("cookieAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    if (!id) {
      throw new ApiError(400, messages.errors.validation.missingId);
    }

    await useCases.deleteSeason().execute(id);

    return { message: messages.success.delete };
  }

  /**
   * Set season watch state for a user
   */
  @Post("{id}/watch-state")
  @Security("cookieAuth")
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetWatchStateDTO
  ): Promise<MessageResponse> {
    const { watched, userId } = body;

    if (!userId || !id) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    const season = await useCases.getSeasonById().execute(id);

    if (!season) {
      throw new ApiError(404, messages.errors.notFound.season);
    }

    // Get first or last episode
    const episodeIndex = watched === true ? season.episodes.length - 1 : 0;
    const episode = season.episodes.sort(
      (a, b) => a.episodeNumber - b.episodeNumber
    )[episodeIndex];

    // Set episode watched state
    await useCases.setEpisodeWatchState().execute(episode.id, userId, watched);

    return { message: messages.success.update };
  }
}
