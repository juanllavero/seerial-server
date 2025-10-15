import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import { deleteEpisode, updateEpisode } from "./episodes.service";

const router = express.Router();

// Update Episode
router.put(
  "/episode/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedEpisodeData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedEpisode = await updateEpisode(id, updatedEpisodeData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedEpisode,
    });
  })
);

// Delete Episode
router.delete(
  "/episode/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const deleted = await deleteEpisode(id);

    if (!deleted) {
      return next(new ApiError(404, messages.errors.delete));
    }

    res.status(200).json({ message: messages.success.delete });
  })
);

export default router;
