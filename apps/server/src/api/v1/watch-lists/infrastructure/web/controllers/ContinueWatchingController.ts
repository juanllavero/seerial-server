import type { ContinueWatchingVideoDTO } from "@seerial/domain";
import type { Request as ExpressRequest } from "express";
import { Controller, Get, Request, Route, Security, Tags } from "tsoa";
import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { ApiResponse } from "@/api/v1/shared/infrastructure/web/http/APIResponse";
import { getUserId } from "@/utils/auth";

@Route("continue-watching")
@Tags("Continue Watching")
export class ContinueWatchingController extends Controller {
	@Get()
  @Security('cookieAuth')
  public async getVideos(
    @Request() req: ExpressRequest,
  ): Promise<ApiResponse<ContinueWatchingVideoDTO[]>> {
    const userId = getUserId(req);
    return ApiResponse.success(await useCases.getContinueWatchingVideos().execute(userId));
  }
}
