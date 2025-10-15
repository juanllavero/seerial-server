import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { changeIdentificationMovie } from "@/file-search/utils/changeIdentification";
import { refreshMovieMetadata } from "@/file-search/utils/refreshMetadata";
import { wsManager } from "@/index";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import { deleteMovie, updateMovie } from "./movies.service";

const router = express.Router();

// Refresh metadata for movie
router.post(
  "/refreshMovieMetadata",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.body;

    if (!id) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    refreshMovieMetadata(id, wsManager);
    return res.status(200).json({ message: messages.success.update });
  })
);

// Update TheMovieDB id for movie
router.post(
  "/updateMovieId",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id, themdbId } = req.body;

    if (!id || !themdbId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    changeIdentificationMovie(id, themdbId, wsManager);
    return res.status(200).json({ message: messages.success.update });
  })
);

// Update Movie
router.put(
  "/movie/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedMovieData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedMovie = await updateMovie(id, updatedMovieData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedMovie,
    });
  })
);

// Delete Movie
router.delete(
  "/movie/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const deleted = await deleteMovie(id);

    if (!deleted) {
      return next(new ApiError(404, messages.errors.delete));
    }

    res.status(200).json({ message: messages.success.delete });
  })
);

export default router;
