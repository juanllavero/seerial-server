import { EpisodeRepositoryImpl } from "@/api/v0/episodes/infrastructure/persistence/repositories/EpisodeRepositoryImpl";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteSeasonUseCase } from "../../../application/usecases/DeleteSeasonsUseCase";
import { UpdateSeasonUseCase } from "../../../application/usecases/UpdateSeasonsUseCase";
import { SeasonsRepositoryImpl } from "../../persistence/repositories/SeasonsRepositoryImpl";

const seasonsRepo = new SeasonsRepositoryImpl();
const episodeRepo = new EpisodeRepositoryImpl();

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

      const useCase = new DeleteSeasonUseCase(seasonsRepo, episodeRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }
}
