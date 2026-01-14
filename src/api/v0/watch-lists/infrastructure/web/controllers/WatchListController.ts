import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";

export class WatchListController {
  static async updateWatchState(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { videoId, timeWatched, watched, userId } = req.body;
      if (videoId == null || timeWatched == null || watched == null || !userId)
        throw new ApiError(400, messages.errors.validation.notEnoughParams);

      const updateWatchState = useCases.updateWatchStateUseCase();
      const result = await updateWatchState.execute({
        videoId,
        timeWatched,
        watched,
        userId,
      });

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
