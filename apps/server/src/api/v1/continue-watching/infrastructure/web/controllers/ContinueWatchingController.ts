import type { Request as ExpressRequest } from 'express';
import { Controller, Get, Request, Route, Security, Tags } from 'tsoa';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { ApiResponse } from '@/api/v1/shared/infrastructure/web/http/APIResponse';
import { getUserId } from '@/utils/auth';
import type { ContinueWatchingVideo } from '../../../application/dtos/ContinueWatchingDTOs';

@Route('continue-watching')
@Tags('Continue Watching')
export class ContinueWatchingController extends Controller {
  /**
   * Get videos for continue watching
   */
  @Get()
  @Security('cookieAuth')
  public async getVideos(
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<ContinueWatchingVideo[]>> {
    const userId = getUserId(req);
    return ApiResponse.success(await useCases.getContinueWatchingVideos().execute(userId));
  }
}
