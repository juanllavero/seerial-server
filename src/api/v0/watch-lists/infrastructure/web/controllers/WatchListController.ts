import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteAlbumUseCase } from "../../../application/usecases/DeleteAlbumUseCase";
import { UpdateAlbumUseCase } from "../../../application/usecases/UpdateAlbumUseCase";
import { UpdateWatchStateUseCase } from "../../../application/usecases/UpdateWatchStateUseCase";
import { WatchListRepositoryImpl } from "../../persistence/repositories/WatchListRepositoryImpl";

const watchListRepo = new WatchListRepositoryImpl();

export class WatchListController {
  static async updateWatchState(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateWatchStateUseCase(watchListRepo);
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

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateAlbumUseCase(watchListRepo);
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

      const useCase = new DeleteAlbumUseCase(watchListRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }
}
