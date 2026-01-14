import { fileSystemService } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import crypto from "crypto";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs-extra";
import os from "os";

export class VideoExtractionService {
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

    ffmpeg(videoSrc)
      .seekInput(timeParam)
      .frames(1)
      .toFormat("mjpeg")
      .on("error", (err) => {
        console.error("FFMPEG error generating thumbnail:", err.message);
        if (!res.headersSent) {
          res.status(500).send(messages.errors.server.internal);
        }
      })
      .pipe(res, { end: true });
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

    ffmpeg(videoPath)
      .inputOptions(startTimeNum > 0 ? [`-ss ${startTimeNum}`] : [])
      .outputOptions([`-map 0:s:${trackIdNum}`])
      .outputFormat("webvtt")
      .on("error", (err: any) => {
        console.error("FFMPEG error generating subtitles:", err);
        if (!res.headersSent) {
          res.status(500).send(messages.errors.server.internal);
        }
      })
      .on("end", () => {
        fs.createReadStream(cachedFile).pipe(res);
      })
      .save(cachedFile);
  }
}
