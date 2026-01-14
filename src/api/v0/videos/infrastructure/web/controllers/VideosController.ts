import {
  librariesRepo,
  useCases,
  videosRepo,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MediaManager } from "@/managers/MediaManager";
import { NextFunction, Request, Response } from "express";
import { DeleteVideoUseCase } from "../../../application/usecases/DeleteVideoUseCase";
import { UpdateMediaInfoUseCase } from "../../../application/usecases/UpdateMediaInfoUseCase";
import { UpdateVideoUseCase } from "../../../application/usecases/UpdateVideosUseCase";

export class VideosController {
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateVideoUseCase(videosRepo);
      const result = await useCase.execute(id, req.body);

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new DeleteVideoUseCase(videosRepo, librariesRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }

  static async updateMediaInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateMediaInfoUseCase(videosRepo);
      const result = await useCase.execute(id);

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getVideoInfo(req: Request, res: Response, next: NextFunction) {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    const videoInfo = await MediaManager.getFormattedVideoInfo(id);

    res.status(200).json(videoInfo);
  }

  static async setWatchState(req: Request, res: Response, next: NextFunction) {
    const { id: videoId } = req.params;
    const { watched, userId } = req.body;

    if (!videoId || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const video = await useCases.getVideoById().execute(videoId);

    if (!video) {
      return next(new ApiError(404, messages.errors.notFound.video));
    }

    if (watched) {
      await useCases.addVideoToWatchList().execute(videoId, userId);
    } else {
      await useCases.removeVideoFromWatchList().execute(videoId, userId);
    }
    await useCases.updateVideo().execute(video.id, video);

    return res.status(200).json({ message: messages.success.update });
  }
}
