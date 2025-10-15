import { getVideoById } from "@/api/v0/videos/videos.service";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { getMediaInfo } from "@/ffmpeg/mediaInfo";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";

const router = express.Router();

// Test endpoint to get media info
router.put(
  "/updateMediaInfo",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { videoId } = req.body;

    if (!videoId) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const video = await getVideoById(videoId);

    if (!video) {
      return next(new ApiError(400, messages.errors.notFound.video));
    }

    const mediaInfo = await getMediaInfo(video.fileSrc);

    if (!mediaInfo) {
      return next(new ApiError(400, messages.errors.notFound.mediaInfo));
    }

    video.mediaInfo = mediaInfo.mediaInfo;
    video.videoTracks = mediaInfo.videoTracks;
    video.subtitleTracks = mediaInfo.subtitleTracks;
    video.audioTracks = mediaInfo.audioTracks;
    video.chapters = mediaInfo.chapters;
    video.runtime = mediaInfo.duration;

    await video.save();

    return res.status(200).json(mediaInfo);
  })
);

export default router;
