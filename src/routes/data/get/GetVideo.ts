import crypto from "crypto";
import express from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs-extra";
import jwt from "jsonwebtoken";
import os from "os";
import path from "path";
import { FilesManager } from "../../../utils/FilesManager";
const router = express.Router();

router.post("/get-stream-url", (req: any, res: any) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { filePath, start, audio, quality, bitrate, expiresIn } = req.body;

  if (!filePath) {
    return res.status(400).json({ error: "Missing file path" });
  }

  // Generate temporal token
  const token = jwt.sign(
    {
      userId,
      path: filePath,
      start: start || 0,
      audio: audio || 0,
      quality: quality || "0",
      bitrate: bitrate || 0,
    },
    process.env.JWT_SECRET!,
    { expiresIn: expiresIn || "2m" }
  );

  // Generate stream URL
  const params = new URLSearchParams({ token });
  const url = `/stream-video?${params.toString()}`;

  res.json({ url });
});

// Get video thumbnail
router.get("/video-thumbnail", (req: any, res: any) => {
  const videoUrl = req.query.url;
  const time = req.query.time || "10"; // 10 seconds by default

  if (!videoUrl) {
    return res.status(400).send("No video url provided.");
  }

  const videoSrc = videoUrl.startsWith("resources")
    ? FilesManager.getExternalPath(videoUrl)
    : videoUrl;

  try {
    res.setHeader("Content-Type", "image/jpeg");

    ffmpeg(videoSrc)
      .seekInput(time)
      .frames(1)
      .toFormat("mjpeg")
      .on("error", (err) => {
        console.error("FFMPEG error:", err.message);
        if (!res.headersSent) {
          res.status(500).send("The video could not be processed.");
        }
      })
      .pipe(res, { end: true });
  } catch (error: any) {
    if (!res.headersSent) {
      res.status(500).send("Internal server error.");
    }
  }
});

// Get subtitles from video
router.get("/subs-from-video", async (req: any, res: any) => {
  const videoPath = req.query.path as string;
  const trackId = parseInt(req.query.trackId as string);
  const startTime = parseFloat(req.query.startTime as string) || 0;

  if (!fs.existsSync(videoPath)) {
    return res.status(404).send("Video not found");
  }

  // Generate unique hash for cache (include startTime to avoid mismatched cache)
  const hash = crypto
    .createHash("md5")
    .update(videoPath + trackId + startTime)
    .digest("hex");
  const cacheDir = path.join(os.tmpdir(), "video_subs_cache");
  await fs.ensureDir(cacheDir);
  const cachedFile = path.join(cacheDir, `${hash}.vtt`);

  // Serve cached VTT if it exists
  if (await fs.pathExists(cachedFile)) {
    res.setHeader("Content-Type", "text/vtt");
    return fs.createReadStream(cachedFile).pipe(res);
  }

  res.setHeader("Content-Type", "text/vtt");

  ffmpeg(videoPath)
    .inputOptions(startTime > 0 ? [`-ss ${startTime}`] : [])
    .outputOptions([`-map 0:s:${trackId}`])
    .outputFormat("webvtt")
    .on("error", (err: any) => {
      console.error("FFmpeg error:", err);
      if (!res.headersSent) res.status(500).send("Subtitle extraction failed");
    })
    .on("end", () => {
      // stream to client once finished
      fs.createReadStream(cachedFile).pipe(res);
    })
    .save(cachedFile);
});

export default router;
