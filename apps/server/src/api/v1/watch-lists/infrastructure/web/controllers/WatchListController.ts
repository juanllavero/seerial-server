import type { Request as ExpressRequest } from 'express';
import { Body, Controller, Put, Request, Route, Security, Tags } from 'tsoa';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { BadRequestException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { messages } from '@/config/messages';
import type { UpdateWatchStateDTO } from '../../../application/dtos/WatchListDTOs';

type AuthenticatedRequest = ExpressRequest & { user?: { id?: string } };

@Route('watch-lists')
@Tags('Watch Lists')
export class WatchListController extends Controller {
  /**
   * Update watch state for a video
   */
  @Put('watch-state')
  @Security('cookieAuth')
  public async updateWatchState(
    @Body() body: UpdateWatchStateDTO,
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<null>> {
    const { videoId, timeWatched, watched, userId: bodyUserId } = body;
    const userId = (req as AuthenticatedRequest).user?.id ?? bodyUserId;

    if (!userId) {
      throw new BadRequestException(messages.errors.validation.notEnoughParams);
    }

    await useCases.updateWatchStateUseCase().execute({
      videoId,
      timeWatched,
      watched,
      userId,
    });

    return ApiResponse.success(null, messages.success.update);
  }
}
