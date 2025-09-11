import express from "express";
const router = express.Router();

import crypto from "crypto";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { FilesManager } from "../../../utils/FilesManager";
import { Utils } from "../../../utils/Utils";

const CACHE_DIR = path.join(FilesManager.resourcesPath, "cache", "audio");
// Make sure the cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

/**
 * Helper function to serve a file with range support
 */
const serveFileWithRangeSupport = (filePath: string, req: any, res: any) => {
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
};

/**
 * Route for serving audio files
 * @route GET /audio-stream
 * @desc Streams an audio file
 */
router.get("/audio-stream", async (req: any, res: any) => {
  const audioPath = decodeURIComponent(req.query.path);
  const isWeb = req.query.isWeb === "true";

  if (typeof audioPath !== "string" || !fs.existsSync(audioPath)) {
    return res.status(404).send("Audio file not found.");
  }

  const fileExtension = path.extname(audioPath).toLowerCase();

  if (!isWeb || Utils.webCompatibleAudioCodecs.includes(fileExtension)) {
    return serveFileWithRangeSupport(audioPath, req, res);
  }

  try {
    // Cache file route
    const originalPathHash = crypto
      .createHash("md5")
      .update(audioPath)
      .digest("hex");
    const cachedFilePath = path.join(CACHE_DIR, `${originalPathHash}.mp3`);

    // Check if cached file already exists
    if (fs.existsSync(cachedFilePath)) {
      console.log(`Serving from cache: ${cachedFilePath}`);
      return serveFileWithRangeSupport(cachedFilePath, req, res);
    }

    const codec: string = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(audioPath, (err, metadata) => {
        if (err) return reject(err);
        const audioStream = metadata.streams.find(
          (s) => s.codec_type === "audio"
        );
        resolve(audioStream?.codec_name || "unknown");
      });
    });

    console.log(
      `Codec '${codec}' requires conversion. Caching to: ${cachedFilePath}`
    );

    // Convert audio to web compatible format
    await new Promise<void>((resolve, reject) => {
      ffmpeg(audioPath)
        .audioCodec("libmp3lame")
        .audioBitrate(320)
        .output(cachedFilePath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    console.log("Conversion finished. Serving from cache.");
    return serveFileWithRangeSupport(cachedFilePath, req, res);
  } catch (error: any) {
    console.error("Error in /audio-stream:", error.message);
    if (!res.headersSent) {
      res.status(500).send("Server error during audio processing.");
    }
  }
});

export default router;
