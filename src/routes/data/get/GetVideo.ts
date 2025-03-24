import express from "express";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs-extra";
import path from "path";
const router = express.Router();

// Types for resolutions and configurations
type ResolutionKey = "480p" | "720p" | "1080p" | "4K";

// Valid resolutions and their corresponding heights
const resolutionMap: Record<string, number> = {
  "480p": 480,
  "720p": 720,
  "1080p": 1080,
  "4K": 2160,
};

// Valid bitrate values
const validBitrates: number[] = [
  200, 300, 700, 1500, 2000, 3000, 4000, 8000, 10000, 12000, 15000, 20000,
];

// Endpoint for video streaming
router.get("/stream-video", (req: any, res: any) => {
  // Set FFmpeg path
  ffmpeg.setFfmpegPath(ffmpegPath || "");

  // Query parameters
  const videoPath = req.query.path;
  const videoStart = parseInt(req.query.start) || 0;
  const audioTrack = parseInt(req.query.audio) || 0;
  const subtitleTrack = parseInt(req.query.subs) || -1;
  const quality = req.query.quality || "0";
  const bitrate = parseInt(req.query.bitrate) || 0;

  // Check if the file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: "Video not found" });
  }

  // Configure headers for streaming
  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Accept-Ranges", "bytes");

  // Initialize FFmpeg command
  const ffmpegCommand = ffmpeg(videoPath)
    .audioCodec("opus")
    .audioBitrate("128k")
    .format("mp4");

  // Handle video quality and bitrate
  const isQualityZero = quality === "0" || quality === 0;
  const isValidResolution = Object.keys(resolutionMap).includes(quality);
  const isValidBitrate = validBitrates.includes(bitrate);

  // Compress video track or copy
  if (isQualityZero || !isValidResolution || !isValidBitrate) {
    ffmpegCommand.videoCodec("copy");
  } else {
    const resolutionHeight = resolutionMap[quality as ResolutionKey];
    ffmpegCommand
      .videoCodec("libx264")
      .videoBitrate(`${bitrate}k`)
      .size(`?x${resolutionHeight}`)
      .outputOptions([
        "-preset veryfast", // Quality preset
      ]);
  }

  // Add common output options
  ffmpegCommand.outputOptions([
    "-movflags frag_keyframe+empty_moov",
    `-ss ${videoStart}`,
    "-map 0:v:0",
    `-map 0:a:${audioTrack}`,
    ...(subtitleTrack >= 0 ? [`-map 0:s:${subtitleTrack}`] : ["-sn"]),
    "-copyts", // Copy original timestamps
    "-avoid_negative_ts make_zero", // Adjust negative timestamps
    "-max_muxing_queue_size 1024",
  ]);

  // Error handling
  ffmpegCommand.on("error", (err: any) => {
    console.error("FFmpeg error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Error processing the video" });
    }
  });

  // Pipe the stream to the response
  ffmpegCommand.pipe(res, { end: true });
});

// Get video file in user drive
router.get("/video-file", (req: any, res: any) => {
  // Ruta absoluta del vídeo, que puede estar en cualquier unidad
  const videoPath = decodeURIComponent(req.query.path); // Pasar la ruta del vídeo como parámetro en la query

  if (typeof videoPath !== "string") {
    return res.status(400).send("Invalid video path");
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res
        .status(416)
        .send("Requested range not satisfiable\n" + start + " >= " + fileSize);
      return;
    }

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": (() => {
        const ext = path.extname(videoPath).toLowerCase();
        switch (ext) {
          case ".mkv":
            return "video/x-matroska";
          case ".m2ts":
            return "video/MP2T";
          case ".mp4":
            return "video/mp4";
          case ".webm":
            return "video/webm";
          case ".avi":
            return "video/avi";
          case ".mov":
            return "video/quicktime";
          default:
            return "video/mp4"; // Unknown extension, fallback to MP4
        }
      })(),
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

export default router;
