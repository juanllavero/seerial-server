import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import { Body, Controller, Put, Route, Security, Tags } from "tsoa";
import {
  UpdateWatchStateDTO,
  WatchListResponse,
} from "../../../application/dtos/WatchListDTOs";

@Route("watch-lists")
@Tags("Watch Lists")
export class WatchListController extends Controller {
  /**
   * Update watch state for a video
   */
  @Put("watch-state")
  @Security("cookieAuth")
  public async updateWatchState(
    @Body() body: UpdateWatchStateDTO
  ): Promise<WatchListResponse> {
    const { videoId, timeWatched, watched, userId } = body;

    const result = await useCases.updateWatchStateUseCase().execute({
      videoId,
      timeWatched,
      watched,
      userId,
    });

    return {
      status: "success",
      message: messages.success.update,
      data: result,
    };
  }
}
