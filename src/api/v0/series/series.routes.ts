import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { changeIdentificationShow } from "@/file-search/utils/changeIdentification";
import { refreshSeriesMetadata } from "@/file-search/utils/refreshMetadata";
import { wsManager } from "@/index";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import { deleteSeries, updateSeries } from "./series.service";

const router = express.Router();

// Refresh metadata for show
router.post(
  "/refreshShowMetadata",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.body;

    if (!id) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    refreshSeriesMetadata(id, wsManager);
    return res.status(200).json({ message: messages.success.update });
  })
);

// Update TheMovieDB id for show
router.post(
  "/updateShowId",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id, themdbId } = req.body;

    if (!id || !themdbId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    changeIdentificationShow(id, themdbId, wsManager);

    return res.status(200).json({ message: messages.success.update });
  })
);

// Update episode group for show
router.post(
  "/updateEpisodeGroup",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id, themdbId, episodeGroupId } = req.body;

    if (!id || !themdbId || !episodeGroupId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    changeIdentificationShow(id, themdbId, wsManager, episodeGroupId);
    return res.status(200).json({ message: messages.success.update });
  })
);

// Update Show
router.put(
  "/show/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedShowData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedShow = await updateSeries(id, updatedShowData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedShow,
    });
  })
);

// Delete Show
router.delete(
  "/series/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const deleted = await deleteSeries(id);

    if (!deleted) {
      return next(new ApiError(404, messages.errors.delete));
    }

    res.status(200).json({ message: messages.success.delete });
  })
);

export default router;
