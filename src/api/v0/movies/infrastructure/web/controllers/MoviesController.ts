import { LibrariesRepositoryImpl } from "@/api/v0/libraries/infrastructure/persistence/repositories/LibraryRepositoryImpl";
import { VideosRepositoryImpl } from "@/api/v0/videos/infrastructure/persistence/repositories/VideosRepositoryImpl";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { changeIdentificationMovie } from "@/file-search/utils/changeIdentification";
import { refreshMovieMetadata } from "@/file-search/utils/refreshMetadata";
import { NextFunction, Request, Response } from "express";
import { DeleteMovieUseCase } from "../../../application/usecases/DeleteMoviesUseCase";
import { UpdateMovieUseCase } from "../../../application/usecases/UpdateMoviesUseCase";
import { MoviesRepositoryImpl } from "../../persistence/repositories/MoviesRepositoryImpl";

const librariesRepo = new LibrariesRepositoryImpl();
const moviesRepo = new MoviesRepositoryImpl();
const videosRepo = new VideosRepositoryImpl();

export class MoviesController {
  static async refreshMovieMetadata(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.body;
      if (!id)
        throw new ApiError(400, messages.errors.validation.notEnoughParams);

      await refreshMovieMetadata(id);

      res.status(200).json({ message: messages.success.update });
    } catch (err) {
      next(err);
    }
  }

  static async changeIdentification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id, themdbId } = req.body;
      if (!id || !themdbId)
        throw new ApiError(400, messages.errors.validation.notEnoughParams);

      changeIdentificationMovie(id, themdbId);

      res.status(200).json({ message: messages.success.update });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateMovieUseCase(moviesRepo);
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

      const useCase = new DeleteMovieUseCase(
        librariesRepo,
        moviesRepo,
        videosRepo
      );
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }
}
