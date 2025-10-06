import { messages } from "@/config/messages";
import { FilesManager } from "@/managers/FilesManager";
import ApiError from "@/utils/ApiError";
import catchAsync from "@/utils/catchAsync";
import crypto from "crypto";
import express, { NextFunction, Request, Response } from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs-extra";
import jwt from "jsonwebtoken";
import os from "os";
import path from "path";

const router = express.Router();

/**
 * @route POST /get-stream-url
 * @description Generates a JWT-signed URL for video streaming.
 */
router.post(
  "/get-stream-url",
  catchAsync(async (req: any, res: any, next: NextFunction) => {
    const userId = req.user.id;
    if (!userId) {
      return next(
        new ApiError(401, messages.errors.server.userNotAuthenticated)
      );
    }

    const { filePath, start, audio, quality, bitrate, expiresIn } = req.body;

    if (!filePath) {
      return next(new ApiError(400, "El parámetro 'filePath' es requerido."));
    }

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

    const params = new URLSearchParams({ token });
    const url = `/stream-video?${params.toString()}`;

    res.status(200).json(url);
  })
);

/**
 * @route POST /get-stream-url
 * @description Generates a JWT-signed URL for video streaming.
 */
router.post(
  "/get-video-url",
  catchAsync(async (req: any, res: any, next: NextFunction) => {
    const userId = req.user.id;
    if (!userId) {
      return next(
        new ApiError(401, messages.errors.server.userNotAuthenticated)
      );
    }

    const { filePath, expiresIn } = req.body;

    if (!filePath) {
      return next(new ApiError(400, "El parámetro 'filePath' es requerido."));
    }

    const token = jwt.sign(
      {
        userId,
        path: filePath,
      },
      process.env.JWT_SECRET!,
      { expiresIn: expiresIn || "2m" }
    );

    const params = new URLSearchParams({ token });
    const url = `/video-file?${params.toString()}`;

    res.status(200).json(url);
  })
);

/**
 * @route GET /video-thumbnail
 * @description Extracts a video thumbnail and returns it as a JPEG image.
 */
router.get(
  "/video-thumbnail",
  (req: Request, res: Response, next: NextFunction) => {
    const videoUrl = req.query.url as string;
    const time = (req.query.time as string) || "10";

    if (!videoUrl) {
      return next(new ApiError(400, "No se proporcionó la URL del vídeo."));
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
          console.error("Error de FFMPEG al generar thumbnail:", err.message);
          if (!res.headersSent) {
            res.status(500).send("No se pudo procesar el vídeo.");
          }
        })
        .pipe(res, { end: true });
    } catch (error) {
      return next(
        new ApiError(
          500,
          "Error interno al iniciar el procesamiento del thumbnail."
        )
      );
    }
  }
);

/**
 * @route GET /subs-from-video
 * @desc Extracts a subtitle track from a video and serves it as a VTT file.
 */
router.get(
  "/subs-from-video",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const videoPath = req.query.path as string;
    const trackId = parseInt(req.query.trackId as string);
    const startTime = parseFloat(req.query.startTime as string) || 0;

    if (isNaN(trackId)) {
      return next(
        new ApiError(400, "El parámetro 'trackId' debe ser un número.")
      );
    }

    if (!fs.existsSync(videoPath)) {
      return next(new ApiError(404, "El archivo de vídeo no fue encontrado."));
    }

    const hash = crypto
      .createHash("md5")
      .update(videoPath + trackId + startTime)
      .digest("hex");
    const cacheDir = path.join(os.tmpdir(), "video_subs_cache");
    await fs.ensureDir(cacheDir);
    const cachedFile = path.join(cacheDir, `${hash}.vtt`);

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
        console.error("Error de FFmpeg al extraer subtítulos:", err);
        if (!res.headersSent) {
          res.status(500).send("La extracción de subtítulos falló.");
        }
      })
      .on("end", () => {
        fs.createReadStream(cachedFile).pipe(res);
      })
      .save(cachedFile);
  })
);

export default router;
