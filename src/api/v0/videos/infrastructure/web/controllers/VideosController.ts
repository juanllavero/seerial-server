import { LibrariesRepositoryImpl } from "@/api/v0/libraries/infrastructure/persistence/repositories/LibraryRepositoryImpl";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteVideoUseCase } from "../../../application/usecases/DeleteVideoUseCase";
import { UpdateMediaInfoUseCase } from "../../../application/usecases/UpdateMediaInfoUseCase";
import { UpdateVideoUseCase } from "../../../application/usecases/UpdateVideosUseCase";
import { VideosRepositoryImpl } from "../../persistence/repositories/VideosRepositoryImpl";

const videoRepo = new VideosRepositoryImpl();
const libraryRepo = new LibrariesRepositoryImpl();

export class VideosController {
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateVideoUseCase(videoRepo);
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

      const useCase = new DeleteVideoUseCase(videoRepo, libraryRepo);
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

      const useCase = new UpdateMediaInfoUseCase(videoRepo);
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
}
