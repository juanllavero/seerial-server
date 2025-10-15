import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { LibraryManager } from "@/managers/LibraryManager";
import catchAsync from "@/utils/catchAsync";
import { getUserId } from "@/utils/utils";
import express, { NextFunction, Request, Response } from "express";

const router = express.Router();

router.get(
  "/library",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string")
      return next(new ApiError(400, "Query parameter 'id' is required."));
    const library = await LibraryManager.getLibraryById(id);
    res.status(200).json(library);
  })
);

router.get(
  "/libraries",
  catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const libraries = await LibraryManager.getAllLibraries();
    res.status(200).json(libraries);
  })
);

router.get(
  "/library-content",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId, type } = req.query;
    const userId = getUserId(req);
    if (typeof libraryId !== "string" || typeof type !== "string") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }
    const content = await LibraryManager.getLibraryContent(
      libraryId,
      type,
      userId
    );
    res.status(200).json(content);
  })
);

router.get(
  "/library-content-flat",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId, type } = req.query;
    const userId = getUserId(req);
    if (typeof libraryId !== "string" || typeof type !== "string") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }
    const content = await LibraryManager.getLibraryContent(
      libraryId,
      type,
      userId,
      true
    );
    res.status(200).json(content);
  })
);

router.get(
  "/library/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId } = req.query;
    if (typeof libraryId !== "string")
      return next(
        new ApiError(400, "Query parameter 'libraryId' is required.")
      );
    const result = await LibraryManager.startLibraryScan(libraryId);
    res.status(202).json(result);
  })
);

export default router;
