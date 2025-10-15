import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { Response } from "express";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs-extra";
import path from "path";
import { SanitizationManager } from "./SanitizationManager";

let ffmpegPathFinal = ffmpegPath ?? "";

// If app.asar is used, use app.asar.unpacked
if (ffmpegPathFinal.includes("app.asar")) {
  ffmpegPathFinal = ffmpegPathFinal.replace("app.asar", "app.asar.unpacked");
}

type ResolutionKey = "480p" | "720p" | "1080p" | "4K";
const resolutionMap: Record<string, number> = {
  "480p": 480,
  "720p": 720,
  "1080p": 1080,
  "4K": 2160,
};
const validBitrates: number[] = [
  200, 300, 700, 1500, 2000, 3000, 4000, 8000, 10000, 12000, 15000, 20000,
];

ffmpeg.setFfmpegPath(ffmpegPathFinal);

export class VideoManager {
  /**
   * Transcodifies and streams a video on the fly using FFmpeg.
   * @param params Decoded parameters from the token (path, quality, etc.).
   * @param res The Express Response object to pipe the video.
   */
  public static transcodeAndStreamVideo(params: any, res: Response): void {
    const {
      path: videoPath,
      start: videoStart,
      audio: audioTrack,
      quality,
      bitrate,
    } = params;

    try {
      const sanitizedVideoPath = SanitizationManager.sanitizeVideoPath(
        videoPath,
        SanitizationManager.getSystemAllowedPaths(),
        true // Must exist
      );

      if (!fs.existsSync(sanitizedVideoPath)) {
        throw new ApiError(404, messages.errors.notFound.video);
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Accept-Ranges", "bytes");

      const ffmpegCommand = ffmpeg(sanitizedVideoPath)
        .audioCodec("opus")
        .audioBitrate("128k")
        .format("mp4");

      const isQualityZero = quality === "0" || quality === 0;
      const isValidResolution = Object.keys(resolutionMap).includes(quality);
      const isValidBitrate = validBitrates.includes(bitrate);

      if (isQualityZero || !isValidResolution || !isValidBitrate) {
        ffmpegCommand.videoCodec("copy");
      } else {
        const resolutionHeight = resolutionMap[quality as ResolutionKey];
        ffmpegCommand
          .videoCodec("libx264")
          .videoBitrate(`${bitrate}k`)
          .size(`?x${resolutionHeight}`)
          .outputOptions(["-preset veryfast"]);
      }

      ffmpegCommand.outputOptions([
        "-movflags frag_keyframe+empty_moov",
        `-ss ${videoStart}`,
        "-map 0:v:0",
        `-map 0:a:${audioTrack}`,
        "-copyts",
        "-avoid_negative_ts make_zero",
        "-max_muxing_queue_size 1024",
      ]);

      ffmpegCommand.on("error", (err: any) => {
        console.error("FFmpeg error:", err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error processing the video" });
        }
      });

      ffmpegCommand.pipe(res, { end: true });
    } catch (error: any) {
      throw new ApiError(400, `Invalid video path: ${error.message}`);
    }
  }

  /**
   * Streams a video file directly with range support.
   * @param videoPath Absolute path of the video.
   * @param req The Express Request object to read the range headers.
   * @param res The Express Response object.
   */
  public static streamDirectVideoFile(req: any, res: any): void {
    const { path: videoPath } = req.videoParams;

    try {
      const sanitizedVideoPath = SanitizationManager.sanitizeVideoPath(
        videoPath,
        SanitizationManager.getSystemAllowedPaths(),
        true // Must exist
      );

      if (!fs.existsSync(sanitizedVideoPath)) {
        throw new ApiError(404, messages.errors.notFound.video);
      }

      const stat = fs.statSync(sanitizedVideoPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        if (start >= fileSize) {
          res
            .status(416)
            .send(
              "Requested range not satisfiable\n" + start + " >= " + fileSize
            );
          return;
        }

        const chunkSize = end - start + 1;
        const file = fs.createReadStream(sanitizedVideoPath, { start, end });
        const ext = path.extname(sanitizedVideoPath).toLowerCase();
        const contentType = this.getVideoContentType(ext);

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": contentType,
        });
        file.pipe(res);
      } else {
        res.writeHead(200, {
          "Content-Length": fileSize,
          "Content-Type": "video/mp4",
        });
        fs.createReadStream(sanitizedVideoPath).pipe(res);
      }
    } catch (error: any) {
      throw new ApiError(400, `Invalid video path: ${error.message}`);
    }
  }

  private static getVideoContentType(ext: string): string {
    const typeMap: Record<string, string> = {
      ".mkv": "video/x-matroska",
      ".m2ts": "video/MP2T",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".avi": "video/avi",
      ".mov": "video/quicktime",
    };
    return typeMap[ext] || "video/mp4"; // Fallback to MP4
  }
}
