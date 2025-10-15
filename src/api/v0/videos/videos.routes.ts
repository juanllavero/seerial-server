import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import { deleteVideo, updateVideo } from "./videos.service";

const router = express.Router();

// Update Video
router.put(
  "/video/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedVideoData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedVideo = await updateVideo(id, updatedVideoData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedVideo,
    });
  })
);

// Delete Video
router.delete(
  "/video/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const deleted = await deleteVideo(id);

    if (!deleted) {
      return next(new ApiError(404, messages.errors.delete));
    }

    res.status(200).json({ message: messages.success.delete });
  })
);

export default router;
