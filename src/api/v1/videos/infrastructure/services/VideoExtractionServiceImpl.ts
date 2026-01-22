import { fileSystemService } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import {
  executeFfmpeg,
  executeFfmpegPipeToStream,
} from "@/ffmpeg/nativeFfmpeg";
import logger from "@/utils/logger";
import crypto from "crypto";
import fs from "fs-extra";
import os from "os";
import { VideoExtractionServicePort } from "../../application/ports/VideoExtractionServicePort";

const videoExtractionLogger = logger.child({ category: "Video Extraction" });

export class VideoExtractionServiceImpl implements VideoExtractionServicePort {
  constructor() {}

  /**
   * Extract video thumbnail and stream it to response
   */
  public async streamVideoThumbnail(
    videoUrl: string,
    time: string,
    res: any
  ): Promise<void> {
    const timeParam = time || "10";

    if (!videoUrl) {
      throw new ApiError(400, messages.errors.validation.notEnoughParams);
    }

    const videoSrc = videoUrl.startsWith("resources")
      ? fileSystemService.getExternalPath(videoUrl)
      : videoUrl;

    res.setHeader("Content-Type", "image/jpeg");

    const args = [
      "-i",
      videoSrc,
      "-ss",
      timeParam,
      "-frames:v",
      "1",
      "-f",
      "mjpeg",
    ];

    executeFfmpegPipeToStream(
      args,
      res,
      (err) => {
        videoExtractionLogger.error(err, "FFMPEG error generating thumbnail");
        if (!res.headersSent) {
          res.status(500).send(messages.errors.server.internal);
        }
      },
      (code) => {
        if (code !== 0) {
          videoExtractionLogger.error(
            { exitCode: code },
            "FFmpeg error: process exited"
          );
          if (!res.headersSent) {
            res.status(500).send(messages.errors.server.internal);
          }
        }
      }
    );
  }

  /**
   * Extract subtitle track from video and stream it to response
   */
  public async streamVideoSubtitles(
    videoPath: string,
    trackId: number,
    startTime: number,
    res: any
  ): Promise<void> {
    const trackIdNum = trackId;
    const startTimeNum = startTime || 0;

    if (isNaN(trackIdNum)) {
      throw new ApiError(400, messages.errors.validation.invalidData);
    }

    if (!fs.existsSync(videoPath)) {
      throw new ApiError(404, messages.errors.notFound.file);
    }

    const hash = crypto
      .createHash("md5")
      .update(videoPath + trackIdNum + startTimeNum)
      .digest("hex");
    const cacheDir = fileSystemService.join(os.tmpdir(), "video_subs_cache");
    await fs.ensureDir(cacheDir);
    const cachedFile = fileSystemService.join(cacheDir, `${hash}.vtt`);

    res.setHeader("Content-Type", "text/vtt");

    if (await fs.pathExists(cachedFile)) {
      return fs.createReadStream(cachedFile).pipe(res);
    }

    const args: string[] = [];
    if (startTimeNum > 0) {
      args.push("-ss", startTimeNum.toString());
    }
    args.push(
      "-i",
      videoPath,
      "-map",
      `0:s:${trackIdNum}`,
      "-f",
      "webvtt",
      cachedFile
    );

    try {
      await executeFfmpeg(args);
      fs.createReadStream(cachedFile).pipe(res);
    } catch (error) {
      videoExtractionLogger.error(error, "FFMPEG error generating subtitles");
      if (!res.headersSent) {
        res.status(500).send(messages.errors.server.internal);
      }
    }
  }
}
