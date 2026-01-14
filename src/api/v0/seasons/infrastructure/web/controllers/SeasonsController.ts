import {
  seasonsRepo,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { UpdateSeasonUseCase } from "../../../application/usecases/UpdateSeasonsUseCase";

export class SeasonsController {
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateSeasonUseCase(seasonsRepo);
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

      const useCase = useCases.deleteSeason();
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }

  static async setWatchState(req: Request, res: Response, next: NextFunction) {
    const { id: seasonId } = req.params;
    const { watched, userId } = req.body;

    if (!userId || !seasonId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const season = await useCases.getSeasonById().execute(seasonId);

    if (!season) {
      return next(new ApiError(404, messages.errors.notFound.season));
    }

    // Get first or last episode
    const episodeIndex = watched === true ? season.episodes.length - 1 : 0;
    const episode = season.episodes.sort(
      (a, b) => a.episodeNumber - b.episodeNumber
    )[episodeIndex];

    // Set episode watched state
    await useCases.setEpisodeWatchState().execute(episode.id, userId, watched);
    return res.status(200).json({ message: messages.success.update });
  }
}
