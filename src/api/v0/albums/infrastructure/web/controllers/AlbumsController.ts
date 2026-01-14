import { albumsRepo } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteAlbumUseCase } from "../../../application/usecases/DeleteAlbumUseCase";
import { UpdateAlbumUseCase } from "../../../application/usecases/UpdateAlbumUseCase";

export class AlbumsController {
  static async update(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (!id)
      return next(new ApiError(400, messages.errors.validation.missingId));

    const useCase = new UpdateAlbumUseCase(albumsRepo);
    const result = await useCase.execute(id, req.body);

    res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: result,
    });
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (!id)
      return next(new ApiError(400, messages.errors.validation.missingId));

    const useCase = new DeleteAlbumUseCase(albumsRepo);
    await useCase.execute(id);

    res.status(200).json({ message: messages.success.delete });
  }
}
