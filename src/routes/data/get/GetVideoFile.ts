import { videoProcessingService } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { verifyVideoStreamToken } from "@/middleware/video.middleware";
import express, { Request, Response } from "express";

const router = express.Router();

/**
 * @route GET /stream-video
 * @desc Streams a video with transcoding on the fly. Requires temporary token.
 */
router.get(
  "/stream-video",
  verifyVideoStreamToken,
  (req: Request, res: Response) => {
    videoProcessingService.transcodeAndStreamVideo(req.videoParams, res);
  }
);

/**
 * @route GET /video-file
 * @desc Serves a video file directly (passthrough) with range support.
 */
router.get(
  "/video-file",
  verifyVideoStreamToken,
  (req: Request, res: Response) => {
    videoProcessingService.streamDirectVideoFile(req, res);
  }
);

export default router;
