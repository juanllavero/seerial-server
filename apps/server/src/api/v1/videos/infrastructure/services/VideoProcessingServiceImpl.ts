import { executeFfmpegPipeToStream } from "@/api/v1/shared/infrastructure/adapters/ffmpeg/nativeFfmpeg";
import {
  BadRequestException,
  NotFoundException,
} from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { messages } from "@/config/messages";
import logger from "@/utils/logger";
import { VideoProcessingServicePort } from "../../application/ports/VideoProcessingServicePort";

const videoProcessingLogger = logger.child({ category: "Video Processing" });

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

export class VideoProcessingServiceImpl implements VideoProcessingServicePort {
  constructor(private readonly sanitizationService: any) {} // Inject SanitizationService

  transcodeAndStreamVideo(params: any, res: any): void {
    const {
      path: videoPath,
      start: videoStart,
      audio: audioTrack,
      quality,
      bitrate,
    } = params;

    try {
      const sanitizedVideoPath = this.sanitizationService.sanitizeVideoPath(
        videoPath,
        this.sanitizationService.getSystemAllowedPaths(),
        true // Must exist
      );

      if (!require("fs").existsSync(sanitizedVideoPath)) {
        throw new NotFoundException(messages.errors.notFound.video);
      }

      res.setHeader("Content-Type", "video/mp4");
      res.setHeader("Accept-Ranges", "bytes");

      const args = [
        "-i",
        sanitizedVideoPath,
        "-acodec",
        "opus",
        "-ab",
        "128k",
        "-f",
        "mp4",
      ];

      const isQualityZero = quality === "0" || quality === 0;
      const isValidResolution = Object.keys(resolutionMap).includes(quality);
      const isValidBitrate = validBitrates.includes(bitrate);

      if (isQualityZero || !isValidResolution || !isValidBitrate) {
        args.push("-vcodec", "copy");
      } else {
        const resolutionHeight = resolutionMap[quality as ResolutionKey];
        args.push(
          "-vcodec",
          "libx264",
          "-b:v",
          `${bitrate}k`,
          "-vf",
          `scale=-2:${resolutionHeight}`,
          "-preset",
          "veryfast"
        );
      }

      args.push(
        "-movflags",
        "frag_keyframe+empty_moov",
        "-ss",
        videoStart,
        "-map",
        "0:v:0",
        "-map",
        `0:a:${audioTrack}`,
        "-copyts",
        "-avoid_negative_ts",
        "make_zero",
        "-max_muxing_queue_size",
        "1024"
      );

      const streaming = executeFfmpegPipeToStream(
        args,
        res,
        (err) => {
          videoProcessingLogger.error(err, "FFmpeg spawn error");
          if (!res.headersSent) {
            res.writeHead(500);
          }
          res.end();
        },
        (code) => {
          if (code !== 0) {
            videoProcessingLogger.error(
              { exitCode: code },
              "FFmpeg error: process exited"
            );
            if (!res.headersSent) {
              res.writeHead(500);
            }
            res.end();
          }
        }
      );

      res.on("close", () => {
        logger.info("Client disconnected, cancelling stream");
        streaming.cancel();
      });

      // Debugging
      setTimeout(() => {
        logger.debug({ message: "FFmpeg output", stderr: streaming.stderr });
      }, 1000);
    } catch (error: any) {
      throw new BadRequestException(`Invalid video path: ${videoPath}`);
    }
  }

  streamDirectVideoFile(req: any, res: any): void {
    const { path: videoPath } = req.videoParams;
    const fs = require("fs");
    const path = require("path");

    try {
      const sanitizedVideoPath = this.sanitizationService.sanitizeVideoPath(
        videoPath,
        this.sanitizationService.getSystemAllowedPaths(),
        true // Must exist
      );

      if (!fs.existsSync(sanitizedVideoPath)) {
        throw new NotFoundException(messages.errors.notFound.video);
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
      throw new BadRequestException(`Invalid video path: ${videoPath}`);
    }
  }

  private getVideoContentType(ext: string): string {
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
