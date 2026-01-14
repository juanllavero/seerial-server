import {
  continueWatchingRepo,
  episodesRepo,
  seasonsRepo,
  seriesRepo,
  videosRepo,
  watchListRepo,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteEpisodeUseCase } from "../../../application/usecases/DeleteEpisodeUseCase";
import { SetEpisodeWatchStateUseCase } from "../../../application/usecases/SetEpisodeWatchStateUseCase";
import { UpdateEpisodeUseCase } from "../../../application/usecases/UpdateEpisodeUseCase";

export class EpisodesController {
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateEpisodeUseCase(episodesRepo);
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

      const useCase = new DeleteEpisodeUseCase(episodesRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }

  static async setWatchState(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { state } = req.body;
      const userId = (req as any).user?.id;

      if (!id) throw new ApiError(400, messages.errors.validation.missingId);
      if (typeof state !== "boolean") {
        throw new ApiError(400, messages.errors.validation.invalidData);
      }
      if (!userId) throw new ApiError(401, messages.errors.token.missing);

      const useCase = new SetEpisodeWatchStateUseCase(
        episodesRepo,
        seasonsRepo,
        seriesRepo,
        videosRepo,
        watchListRepo,
        continueWatchingRepo
      );

      await useCase.execute(id, userId, state);

      res.status(200).json({
        status: "success",
        message: `Episode watch state updated to ${state}`,
      });
    } catch (err) {
      next(err);
    }
  }
}
