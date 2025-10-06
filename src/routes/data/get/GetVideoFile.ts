import { VideoManager } from "@/managers/VideoManager";
import { verifyVideoStreamToken } from "@/middleware/videoMiddleware";
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
    VideoManager.transcodeAndStreamVideo(req.videoParams, res);
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
    VideoManager.streamDirectVideoFile(req, res);
  }
);

export default router;
