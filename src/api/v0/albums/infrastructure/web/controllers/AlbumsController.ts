import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteAlbumUseCase } from "../../../application/usecases/DeleteAlbumUseCase";
import { UpdateAlbumUseCase } from "../../../application/usecases/UpdateAlbumUseCase";
import { AlbumsRepositoryImpl } from "../../persistence/repositories/AlbumsRepositoryImpl";

const albumRepo = new AlbumsRepositoryImpl();

export class AlbumsController {
  static async update(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (!id)
      return next(new ApiError(400, messages.errors.validation.missingId));

    const useCase = new UpdateAlbumUseCase(albumRepo);
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

    const useCase = new DeleteAlbumUseCase(albumRepo);
    await useCase.execute(id);

    res.status(200).json({ message: messages.success.delete });
  }
}
