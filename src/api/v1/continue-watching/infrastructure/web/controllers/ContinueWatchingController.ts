import { continueWatchingRepo } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { getUserId } from "@/utils/auth";
import { Request as ExpressRequest } from "express";
import { Controller, Get, Request, Route, Security, Tags } from "tsoa";
import { GetVideosUseCase } from "../../../application/usecases/GetVideosUseCase";

@Route("continue-watching")
@Tags("Continue Watching")
export class ContinueWatchingController extends Controller {
  /**
   * Get videos for continue watching
   */
  @Get()
  @Security("cookieAuth")
  public async getVideos(@Request() req: ExpressRequest): Promise<any[]> {
    const userId = getUserId(req);
    const useCase = new GetVideosUseCase(continueWatchingRepo);
    return await useCase.execute(userId);
  }
}
