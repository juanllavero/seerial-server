import { messages } from "@/config/messages";
import { VideoManager } from "@/managers/VideoManager";
import { verifyVideoStreamToken } from "@/middleware/videoMiddleware";
import ApiError from "@/utils/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";

const router = express.Router();

/**
 * @route GET /stream-video
 * @desc Streams a video with transcoding on the fly. Requires temporary token.
 */
router.get(
  "/stream-video",
  verifyVideoStreamToken,
  (req: Request, res: Response) => {
    VideoManager.transcodeAndStreamVideo(req.videoParams, res);
  }
);

/**
 * @route GET /video-file
 * @desc Serves a video file directly (passthrough) with range support.
 */
router.get(
  "/video-file",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const videoPath = req.query.path;

    if (typeof videoPath !== "string" || videoPath.trim() === "") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    VideoManager.streamDirectVideoFile(decodeURIComponent(videoPath), req, res);
  })
);

export default router;
