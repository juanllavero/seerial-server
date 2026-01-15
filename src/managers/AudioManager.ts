import { fileSystemService } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { executeFfmpeg } from "@/ffmpeg/nativeFfmpeg";
import { audioExtensions } from "@/utils/constants";
import crypto from "crypto";
import { Request, Response } from "express";
import fs from "fs";
import path from "path";

const CACHE_DIR = path.join(fileSystemService.resourcesPath, "cache", "audio");
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

export class AudioManager {
  /**
   * Determines the final audio file path that can be transmitted,
   * performing a conversion to MP3 if necessary.
   * @param originalPath The path to the original audio file.
   * @param isWeb Whether the client is a web platform that requires compatible codecs.
   * @returns The path to the audio file ready to be transmitted.
   */
  public static async getStreamableAudioPath(
    originalPath: string,
    isWeb: boolean
  ): Promise<string> {
    if (!fs.existsSync(originalPath)) {
      throw new ApiError(404, messages.errors.notFound.file);
    }

    const fileExtension = path.extname(originalPath).toLowerCase();
    const isCompatible = audioExtensions.includes(fileExtension);

    // If not for web or compatible, just return the original path
    if (!isWeb || isCompatible) {
      return originalPath;
    }

    // Conversion and cache logic
    const originalPathHash = crypto
      .createHash("md5")
      .update(originalPath)
      .digest("hex");
    const cachedFilePath = path.join(CACHE_DIR, `${originalPathHash}.mp3`);

    // Check if cached file already exists
    if (fs.existsSync(cachedFilePath)) {
      return cachedFilePath;
    }

    // Needs conversion
    try {
      await executeFfmpeg([
        "-i",
        originalPath,
        "-acodec",
        "libmp3lame",
        "-ab",
        "320k",
        cachedFilePath,
      ]);

      return cachedFilePath;
    } catch (error) {
      // Clean failed file if created
      if (fs.existsSync(cachedFilePath)) fs.unlinkSync(cachedFilePath);
      throw new ApiError(500, messages.errors.server.internal);
    }
  }

  /**
   * Sends a file to the client with support for streaming (HTTP 206 Partial Content).
   * @param filePath The path to the file that will be transmitted.
   */
  public static streamFile(
    filePath: string,
    req: Request,
    res: Response
  ): void {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "audio/mpeg",
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = { "Content-Length": fileSize, "Content-Type": "audio/mpeg" };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  }
}
