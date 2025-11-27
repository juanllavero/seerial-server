import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { AudioManager } from "@/managers/AudioManager";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Response } from "express";

const router = express.Router();

/**
 * @route GET /audio-stream
 * @desc Streams an audio file, converting it if necessary.
 */
router.get(
  "/audio-stream",
  catchAsync(async (req: any, res: Response, next: NextFunction) => {
    const audioPath = req.query.path;
    const isWeb = req.query.isWeb === "true";

    if (typeof audioPath !== "string" || audioPath.trim() === "") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    // Get file path
    const streamablePath = await AudioManager.getStreamableAudioPath(
      decodeURIComponent(audioPath),
      isWeb
    );

    // Stream the file
    AudioManager.streamFile(streamablePath, req, res);
  })
);

export default router;
