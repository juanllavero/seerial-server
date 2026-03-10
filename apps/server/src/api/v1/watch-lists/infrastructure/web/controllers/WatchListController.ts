import { Body, Controller, Put, Route, Security, Tags } from 'tsoa';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import type { UpdateWatchStateDTO } from '../../../application/dtos/WatchListDTOs';

@Route('watch-lists')
@Tags('Watch Lists')
export class WatchListController extends Controller {
  /**
   * Update watch state for a video
   */
  @Put('watch-state')
  @Security('cookieAuth')
  public async updateWatchState(@Body() body: UpdateWatchStateDTO): Promise<ApiResponse<null>> {
    const { videoId, timeWatched, watched, userId } = body;

    await useCases.updateWatchStateUseCase().execute({
      videoId,
      timeWatched,
      watched,
      userId,
    });

    return ApiResponse.success(null, messages.success.update);
  }
}
