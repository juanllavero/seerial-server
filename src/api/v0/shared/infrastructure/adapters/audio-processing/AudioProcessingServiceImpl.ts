import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { audioExtensions } from "@/utils/utils";
import crypto from "crypto";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { AudioProcessingServicePort } from "../../../application/ports/AudioProcessingServicePort";

export class AudioProcessingServiceImpl implements AudioProcessingServicePort {
  constructor(private readonly fileSystemService: any) {} // Inject FileSystemServicePort

  async getStreamableAudioPath(
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
    const cacheDir = this.fileSystemService.getExternalPath("cache/audio");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const originalPathHash = crypto
      .createHash("md5")
      .update(originalPath)
      .digest("hex");
    const cachedFilePath = path.join(cacheDir, `${originalPathHash}.mp3`);

    // Check if cached file already exists
    if (fs.existsSync(cachedFilePath)) {
      return cachedFilePath;
    }

    // Needs conversion
    try {
      await new Promise<void>((resolve, reject) => {
        ffmpeg(originalPath)
          .audioCodec("libmp3lame")
          .audioBitrate(320)
          .output(cachedFilePath)
          .on("end", () => resolve())
          .on("error", (err) =>
            reject(new Error(`FFMPEG error: ${err.message}`))
          )
          .run();
      });

      return cachedFilePath;
    } catch (error) {
      // Clean failed file if created
      if (fs.existsSync(cachedFilePath)) fs.unlinkSync(cachedFilePath);
      throw new ApiError(500, messages.errors.server.internal);
    }
  }

  streamFile(filePath: string, req: any, res: any): void {
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
