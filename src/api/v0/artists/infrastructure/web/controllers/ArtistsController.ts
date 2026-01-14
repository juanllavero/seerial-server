import { artistsRepo } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { AddArtistUseCase } from "../../../application/usecases/AddArtistUseCase";
import { DeleteArtistUseCase } from "../../../application/usecases/DeleteArtistUseCase";
import { GetArtistByIdUseCase } from "../../../application/usecases/GetArtistByIdUseCase";
import { UpdateArtistUseCase } from "../../../application/usecases/UpdateArtistUseCase";

export class ArtistsController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;

      if (!name) {
        return next(
          new ApiError(400, messages.errors.validation.notEnoughParams)
        );
      }

      const useCase = new AddArtistUseCase(artistsRepo);
      const result = await useCase.execute({ name });

      if (!result) {
        return next(new ApiError(409, "Artist already exists"));
      }

      res.status(201).json({
        status: "success",
        message: messages.success.create,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new GetArtistByIdUseCase(artistsRepo);
      const result = await useCase.execute(id);

      if (!result) {
        return next(new ApiError(404, "Artist not found"));
      }

      res.status(200).json({
        status: "success",
        message: "Artist retrieved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateArtistUseCase(artistsRepo);
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

      const useCase = new DeleteArtistUseCase(artistsRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }
}
