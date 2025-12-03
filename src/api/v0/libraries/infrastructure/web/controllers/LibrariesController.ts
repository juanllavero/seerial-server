import { AlbumsRepositoryImpl } from "@/api/v0/albums/infrastructure/persistence/repositories/AlbumsRepositoryImpl";
import { MoviesRepositoryImpl } from "@/api/v0/movies/infrastructure/persistence/repositories/MoviesRepositoryImpl";
import { SeriesRepositoryImpl } from "@/api/v0/series/infrastructure/persistence/repositories/SeriesRepositoryImpl";
import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { getUserId } from "@/utils/utils";
import { NextFunction, Request, Response } from "express";
import { CreateLibraryUseCase } from "../../../application/usecases/CreateLibraryUseCase";
import { DeleteLibraryUseCase } from "../../../application/usecases/DeleteLibraryUseCase";
import { GetLibrariesUseCase } from "../../../application/usecases/GetLibrariesUseCase";
import { GetLibraryContentUseCase } from "../../../application/usecases/GetLibraryContentUseCase";
import { GetLibraryUseCase } from "../../../application/usecases/GetLibraryUseCase";
import { ReorderLibrariesUseCase } from "../../../application/usecases/ReorderLibrariesUseCase";
import { ReorderLibraryItemsUseCase } from "../../../application/usecases/ReorderLibraryItemsUseCase";
import { UpdateLibraryUseCase } from "../../../application/usecases/UpdateLibraryUseCase";
import { LibrariesRepositoryImpl } from "../../persistence/repositories/LibraryRepositoryImpl";

const librariesRepo = new LibrariesRepositoryImpl();
const seriesRepo = new SeriesRepositoryImpl();
const moviesRepo = new MoviesRepositoryImpl();
const albumsRepo = new AlbumsRepositoryImpl();

export class LibrariesController {
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new GetLibrariesUseCase(librariesRepo);
      const libraries = await useCase.execute();
      res.status(200).json({
        status: "success",
        data: libraries,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.query;
      if (typeof id !== "string")
        throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new GetLibraryUseCase(librariesRepo);
      const library = await useCase.execute(id);
      if (!library) {
        throw new ApiError(404, messages.errors.notFound.library);
      }

      res.status(200).json({
        status: "success",
        data: library,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { libraryId, type, flat } = req.query;
      const userId = getUserId(req);
      if (typeof libraryId !== "string" || typeof type !== "string") {
        throw new ApiError(400, messages.errors.validation.invalidData);
      }

      const useCase = new GetLibraryContentUseCase(librariesRepo);
      const library = await useCase.execute(
        libraryId,
        type,
        userId,
        (flat as string) ?? "false"
      );
      if (!library) {
        throw new ApiError(404, messages.errors.notFound.library);
      }

      res.status(200).json({
        status: "success",
        data: library,
      });
    } catch (err) {
      next(err);
    }
  }

  static async startScan(req: Request, res: Response, next: NextFunction) {
    try {
      const { libraryId } = req.body;
      if (typeof libraryId !== "string")
        return next(new ApiError(400, messages.errors.validation.invalidData));

      const getLibrary = useCases.getLibrary();
      const library = await getLibrary.execute(libraryId);

      if (!library) {
        throw new ApiError(404, messages.errors.notFound.library);
      }

      const useCase = useCases.scanLibrary();
      const message = await useCase.execute(library, false);

      res.status(200).json({
        status: "success",
        message: message,
      });
    } catch (err) {
      next(err);
    }
  }

  static async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderedLibraryIds } = req.body;
      if (!orderedLibraryIds)
        throw new ApiError(400, messages.errors.validation.invalidData);

      const useCase = new ReorderLibrariesUseCase(librariesRepo);
      const result = await useCase.execute(req.body);

      if (!result) {
        throw new ApiError(500, messages.errors.order);
      }

      res.status(200).json({
        status: "success",
        message: messages.success.order,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async reorderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { libraryId, orderedItems } = req.body;

      if (!libraryId || !Array.isArray(orderedItems)) {
        throw new ApiError(400, messages.errors.validation.invalidData);
      }

      const useCase = new ReorderLibraryItemsUseCase(librariesRepo);
      const result = await useCase.execute(libraryId, orderedItems);

      if (!result) {
        throw new ApiError(500, messages.errors.order);
      }

      res.status(200).json({
        status: "success",
        message: messages.success.order,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const libraryData = req.body;

      const useCase = new CreateLibraryUseCase();
      const library = await useCase.execute(libraryData);

      if (!library) {
        return next(new ApiError(404, messages.errors.create));
      }

      res.status(201).json({
        status: "success",
        message: messages.success.create,
        data: library,
      });
    } catch (err) {
      next(err);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateLibraryUseCase(librariesRepo);
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

      const useCase = new DeleteLibraryUseCase(
        librariesRepo,
        seriesRepo,
        moviesRepo,
        albumsRepo
      );
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }
}
