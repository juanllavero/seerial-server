import { MessageResponse } from "@/api/v1/shared/application/dtos/DTOs";
import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
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
  SetSeasonWatchStateDTO,
  UpdateSeasonDTO,
} from "../../../application/dtos/SeasonDTOs";

@Route("seasons")
@Tags("Seasons")
export class SeasonsController extends Controller {
  /**
   * Update season details
   */
  @Put("{id}")
  @Security("adminAuth")
  public async update(
    @Path() id: string,
    @Body() body: UpdateSeasonDTO
  ): Promise<SeasonResponse> {
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
  @Security("adminAuth")
  public async delete(@Path() id: string): Promise<MessageResponse> {
    await useCases.deleteSeason().execute(id);

    return { message: messages.success.delete };
  }

  /**
   * Set season watch state for a user
   */
  @Post("{id}/watch-state")
  @Security("adminAuth")
  public async setWatchState(
    @Path() id: string,
    @Body() body: SetSeasonWatchStateDTO
  ): Promise<MessageResponse> {
    const { watched, userId } = body;

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
