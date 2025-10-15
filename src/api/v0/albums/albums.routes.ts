import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import { deleteAlbum, updateAlbum } from "./albums.service";

const router = express.Router();

// Update Album
router.put(
  "/album/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedAlbumData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedAlbum = await updateAlbum(id, updatedAlbumData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedAlbum,
    });
  })
);

// Delete album
router.delete(
  "/album/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const deleted = await deleteAlbum(id);

    if (!deleted) {
      return next(new ApiError(404, messages.errors.delete));
    }

    res.status(200).json({ message: messages.success.delete });
  })
);

export default router;
