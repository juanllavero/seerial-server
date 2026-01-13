import {
  seriesRepo,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteSeriesUseCase } from "../../../application/usecases/DeleteSeriesUseCase";
import { UpdateEpisodeGroupUseCase } from "../../../application/usecases/UpdateEpisodeGroupUseCase";
import { UpdateSeriesUseCase } from "../../../application/usecases/UpdateSeriesUseCase";
import { UpdateShowIdUseCase } from "../../../application/usecases/UpdateShowIdUseCase";

export class SeriesController {
  static async refreshMetadata(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.body;

      if (!id) {
        return next(
          new ApiError(400, messages.errors.validation.notEnoughParams)
        );
      }

      const useCase = useCases.refreshMetadata();
      useCase.execute(id);
      res.status(200).json({
        status: "success",
        message: messages.success.update,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateShowId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id, themdbId } = req.body;

      if (!id || !themdbId) {
        return next(
          new ApiError(400, messages.errors.validation.notEnoughParams)
        );
      }

      const useCase = new UpdateShowIdUseCase();
      useCase.execute(id, themdbId);
      res.status(200).json({
        status: "success",
        message: messages.success.update,
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateEpisodeGroup(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id, themdbId, episodeGroupId } = req.body;

      if (!id || !themdbId || !episodeGroupId) {
        return next(
          new ApiError(400, messages.errors.validation.notEnoughParams)
        );
      }

      const useCase = new UpdateEpisodeGroupUseCase();
      useCase.execute(id, themdbId, episodeGroupId);
      res.status(200).json({
        status: "success",
        message: messages.success.update,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateSeriesUseCase(seriesRepo);
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

      const useCase = new DeleteSeriesUseCase(seriesRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }
}
