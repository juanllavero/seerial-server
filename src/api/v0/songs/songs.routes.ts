import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import { deleteSong, updateSong } from "./songs.service";

const router = express.Router();

// Update Song
router.put(
  "/song/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedSongData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedSong = await updateSong(id, updatedSongData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedSong,
    });
  })
);

// Delete song
router.delete(
  "/song/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const deleted = await deleteSong(id);

    if (!deleted) {
      return next(new ApiError(404, messages.errors.delete));
    }

    res.status(200).json({ message: messages.success.delete });
  })
);

export default router;
