import { getUserId } from "@/utils/utils";
import { NextFunction, Request, Response } from "express";
import { GetVideosUseCase } from "../../../application/usecases/GetVideosUseCase";
import { ContinueWatchingRepositoryImpl } from "../../persistence/repositories/ContinueWatchingRepositoryImpl";

const continueWatchingRepo = new ContinueWatchingRepositoryImpl();

export class ContinueWatchingController {
  static async getVideos(req: Request, res: Response, _next: NextFunction) {
    const useCase = new GetVideosUseCase(continueWatchingRepo);
    const videos = await useCase.execute(getUserId(req));
    res.status(200).json(videos);
  }
}
