import express, { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import ffmpegPath from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import { fileURLToPath } from "url";

// Tipos para los codecs y configuraciones
type ResolutionKey = "360p" | "720p" | "1080p";
type Quality = ResolutionKey | "original";

interface ResolutionConfig {
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
}

interface SessionData {
  currentTime: number;
  lastGeneratedSegment: Record<Quality, number>;
  isPlaying: boolean;
  generationInProgress: Record<Quality, boolean>;
  videoPath: string;
}

// Get current directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class VideoServer {
  static appServer: Express | null = null;
  static OUTPUT_DIR: string = path.join(__dirname, "hls_segments");
  static SEGMENT_DURATION: number = 4;
  static INITIAL_SEGMENTS: number = 2;
  static PRELOAD_LIMIT: number = 15; // 1 minuto
  static TRANSCODE: boolean = true; // Variable para habilitar/deshabilitar transcodificación

  static RESOLUTIONS: Record<ResolutionKey, ResolutionConfig> = {
    "360p": {
      width: 640,
      height: 360,
      videoBitrate: "800k",
      audioBitrate: "96k",
    },
    "720p": {
      width: 1280,
      height: 720,
      videoBitrate: "2800k",
      audioBitrate: "128k",
    },
    "1080p": {
      width: 1920,
      height: 1080,
      videoBitrate: "5000k",
      audioBitrate: "192k",
    },
  };

  static COMPATIBLE_VIDEO_CODECS: string[] = [
    "h264",
    "h265",
    "vp8",
    "vp9",
    "av1",
  ];
  static COMPATIBLE_AUDIO_CODECS: string[] = ["aac", "mp3", "opus", "vorbis"];

  static sessions: Map<string, SessionData> = new Map();

  public static initializeVideoServer(server: Express): void {
    this.appServer = server;

    ffmpeg.setFfmpegPath(ffmpegPath || "");
    if (!fs.existsSync(VideoServer.OUTPUT_DIR))
      fs.mkdirSync(VideoServer.OUTPUT_DIR);

    // Endpoint para HLS con resolución específica o modo original
    this.appServer.get(
      "/video/:sessionId/:time/:quality",
      async (
        req: Request<
          { sessionId: string; time: string; quality: string },
          any,
          any,
          { path: string }
        >,
        res: Response
      ): Promise<any> => {
        const { sessionId, time, quality } = req.params;
        const videoPath: string = decodeURIComponent(req.query.path); // Ruta absoluta del video
        const startTime: number = parseFloat(time) || 0;

        if (typeof videoPath !== "string" || !fs.existsSync(videoPath)) {
          return res.status(400).send("Invalid or missing video path");
        }

        if (!this.sessions.has(sessionId)) {
          this.sessions.set(sessionId, {
            currentTime: startTime,
            lastGeneratedSegment: {
              "360p": -1,
              "720p": -1,
              "1080p": -1,
              original: -1,
            },
            isPlaying: true,
            generationInProgress: {
              "360p": false,
              "720p": false,
              "1080p": false,
              original: false,
            },
            videoPath,
          });
        }

        const session: SessionData = this.sessions.get(sessionId)!;
        session.currentTime = startTime;

        const segmentIndex: number = Math.floor(
          startTime / VideoServer.SEGMENT_DURATION
        );

        try {
          if (quality === "original") {
            await this.handleOriginalQuality(
              sessionId,
              videoPath,
              startTime,
              res
            );
          } else if (this.RESOLUTIONS[quality as ResolutionKey]) {
            await this.handleCustomQuality(
              sessionId,
              videoPath,
              startTime,
              quality as ResolutionKey,
              res
            );
          } else {
            res.status(400).send("Invalid quality option");
          }
        } catch (error) {
          console.error(`[${sessionId}] Error generating segments:`, error);
          res.status(500).send("Error generating video segments");
        }
      }
    );

    // Endpoint para estado de reproducción
    this.appServer.post(
      "/playback-state/:sessionId",
      async (
        req: Request<
          { sessionId: string },
          any,
          { isPlaying: boolean; currentTime: number; quality: Quality }
        >,
        res: Response
      ): Promise<any> => {
        const { sessionId } = req.params;
        const { isPlaying, currentTime, quality } = req.body;

        if (!this.sessions.has(sessionId))
          return res.status(404).send("Session not found");
        if (
          quality !== "original" &&
          !this.RESOLUTIONS[quality as ResolutionKey]
        )
          return res.status(400).send("Invalid quality");

        const session: SessionData = this.sessions.get(sessionId)!;
        session.isPlaying = isPlaying;
        session.currentTime = currentTime || session.currentTime;

        if (isPlaying) {
          this.preloadSegments(sessionId, session.currentTime, quality);
        }
        res.sendStatus(200);
      }
    );

    // Servir archivos estáticos
    this.appServer.use("/hls_segments", express.static(VideoServer.OUTPUT_DIR));
  }

  // Manejar opción "Original"
  static async handleOriginalQuality(
    sessionId: string,
    videoPath: string,
    startTime: number,
    res: Response
  ): Promise<any> {
    const session: SessionData = this.sessions.get(sessionId)!;
    const segmentIndex: number = Math.floor(startTime / this.SEGMENT_DURATION);
    const { videoCodec, audioCodec } = await this.getOriginalCodecs(videoPath);

    const videoCompatible: boolean = this.COMPATIBLE_VIDEO_CODECS.includes(
      videoCodec ?? "unknown"
    );
    const audioCompatible: boolean = this.COMPATIBLE_AUDIO_CODECS.includes(
      audioCodec ?? "unknown"
    );

    let videoCodecOpt: string = "copy";
    let audioCodecOpt: string = "copy";

    if (!videoCompatible || !audioCompatible) {
      if (!this.TRANSCODE) {
        return res
          .status(400)
          .send(
            "Original codecs not compatible with Chromium and transcoding is disabled"
          );
      }
      videoCodecOpt = !videoCompatible
        ? await this.getBestVideoCodec()
        : "copy";
      audioCodecOpt = !audioCompatible ? "aac" : "copy";
    }

    if (segmentIndex > session.lastGeneratedSegment.original) {
      const playlistPath: string = await this.generateSegments(
        sessionId,
        videoPath,
        startTime,
        this.INITIAL_SEGMENTS,
        "original",
        videoCodecOpt,
        audioCodecOpt
      );
      session.lastGeneratedSegment.original =
        segmentIndex + this.INITIAL_SEGMENTS - 1;
      setTimeout(
        () => this.preloadSegments(sessionId, startTime, "original"),
        0
      );

      let playlistContent: string = fs.readFileSync(playlistPath, "utf8");
      playlistContent = playlistContent.replace(
        new RegExp(this.OUTPUT_DIR + "/", "g"),
        "/hls_segments/"
      );
      res.set("Content-Type", "application/vnd.apple.mpegurl");
      res.send(playlistContent);
    } else {
      const playlistPath: string = path.join(
        this.OUTPUT_DIR,
        `${sessionId}_original_${segmentIndex}.m3u8`
      );
      if (fs.existsSync(playlistPath)) {
        let playlistContent: string = fs.readFileSync(playlistPath, "utf8");
        playlistContent = playlistContent.replace(
          new RegExp(this.OUTPUT_DIR + "/", "g"),
          "/hls_segments/"
        );
        res.set("Content-Type", "application/vnd.apple.mpegurl");
        res.send(playlistContent);
      } else {
        res.status(404).send("Playlist not found");
      }
    }
  }

  // Manejar opción "Resolución y Bitrate"
  static async handleCustomQuality(
    sessionId: string,
    videoPath: string,
    startTime: number,
    quality: ResolutionKey,
    res: Response
  ): Promise<void> {
    const session: SessionData = this.sessions.get(sessionId)!;
    const segmentIndex: number = Math.floor(startTime / this.SEGMENT_DURATION);

    if (segmentIndex > session.lastGeneratedSegment[quality]) {
      const playlistPath: string = await this.generateSegments(
        sessionId,
        videoPath,
        startTime,
        this.INITIAL_SEGMENTS,
        quality,
        "libx264",
        "aac"
      );
      session.lastGeneratedSegment[quality] =
        segmentIndex + this.INITIAL_SEGMENTS - 1;
      setTimeout(() => this.preloadSegments(sessionId, startTime, quality), 0);

      let playlistContent: string = fs.readFileSync(playlistPath, "utf8");
      playlistContent = playlistContent.replace(
        new RegExp(this.OUTPUT_DIR + "/", "g"),
        "/hls_segments/"
      );
      res.set("Content-Type", "application/vnd.apple.mpegurl");
      res.send(playlistContent);
    } else {
      const playlistPath: string = path.join(
        this.OUTPUT_DIR,
        `${sessionId}_${quality}_${segmentIndex}.m3u8`
      );
      if (fs.existsSync(playlistPath)) {
        let playlistContent: string = fs.readFileSync(playlistPath, "utf8");
        playlistContent = playlistContent.replace(
          new RegExp(this.OUTPUT_DIR + "/", "g"),
          "/hls_segments/"
        );
        res.set("Content-Type", "application/vnd.apple.mpegurl");
        res.send(playlistContent);
      } else {
        res.status(404).send("Playlist not found");
      }
    }
  }

  // Generar fragmentos HLS
  static async generateSegments(
    sessionId: string,
    videoPath: string,
    startTime: number,
    numSegments: number,
    quality: Quality,
    videoCodec: string,
    audioCodec: string
  ): Promise<string> {
    const segmentIndex: number = Math.floor(startTime / this.SEGMENT_DURATION);
    const outputPlaylist: string = path.join(
      this.OUTPUT_DIR,
      `${sessionId}_${quality}_${segmentIndex}.m3u8`
    );
    const segmentPattern: string = path.join(
      this.OUTPUT_DIR,
      `${sessionId}_${quality}_${segmentIndex}_%03d.ts`
    );

    const isOriginal: boolean = quality === "original";
    const res: ResolutionConfig | undefined = isOriginal
      ? undefined
      : this.RESOLUTIONS[quality as ResolutionKey];

    return new Promise((resolve, reject) => {
      const command = ffmpeg(videoPath)
        .seekInput(startTime)
        .duration(this.SEGMENT_DURATION * numSegments)
        .outputOptions(
          [
            isOriginal
              ? ""
              : `-vf scale=${res!.width}:${
                  res!.height
                }:force_original_aspect_ratio=decrease`,
            `-c:v ${videoCodec}`,
            `-c:a ${audioCodec}`,
            isOriginal ? "" : `-b:v ${res!.videoBitrate}`,
            isOriginal ? "" : `-b:a ${res!.audioBitrate}`,
            "-hls_time",
            this.SEGMENT_DURATION.toString(),
            "-hls_list_size",
            numSegments.toString(),
            "-hls_segment_filename",
            segmentPattern,
          ].filter(Boolean)
        )
        .output(outputPlaylist)
        .on("end", () => resolve(outputPlaylist))
        .on("error", (err) => reject(err))
        .run();
    });
  }

  // Precargar fragmentos
  static async preloadSegments(
    sessionId: string,
    startTime: number,
    quality: Quality
  ): Promise<void> {
    const session: SessionData = this.sessions.get(sessionId)!;
    if (!session || session.generationInProgress[quality]) return;

    session.generationInProgress[quality] = true;
    const startSegment: number = Math.floor(startTime / this.SEGMENT_DURATION);
    let segmentsToGenerate: number =
      this.PRELOAD_LIMIT -
      (session.lastGeneratedSegment[quality] - startSegment + 1);

    if (segmentsToGenerate <= 0) {
      session.generationInProgress[quality] = false;
      return;
    }

    const nextStartTime: number =
      (session.lastGeneratedSegment[quality] + 1) * this.SEGMENT_DURATION;
    try {
      await this.generateSegments(
        sessionId,
        session.videoPath,
        nextStartTime,
        segmentsToGenerate,
        quality,
        quality === "original" ? "copy" : "libx264",
        quality === "original" ? "copy" : "aac"
      );
      session.lastGeneratedSegment[quality] =
        startSegment + segmentsToGenerate - 1;
      this.cleanOldSegments(sessionId, startSegment, quality);
    } catch (error) {
      console.error(`[${sessionId}] Error preloading ${quality}:`, error);
    }

    session.generationInProgress[quality] = false;

    if (
      session.isPlaying ||
      session.lastGeneratedSegment[quality] <
        startSegment + this.PRELOAD_LIMIT - 1
    ) {
      setTimeout(
        () => this.preloadSegments(sessionId, session.currentTime, quality),
        1000
      );
    }
  }

  // Obtener codecs originales
  static async getOriginalCodecs(videoPath: string): Promise<{
    videoCodec: string | undefined;
    audioCodec: string | undefined;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) return reject(err);
        const videoStream = metadata.streams.find(
          (s) => s.codec_type === "video"
        );
        const audioStream = metadata.streams.find(
          (s) => s.codec_type === "audio"
        );
        resolve({
          videoCodec: videoStream ? videoStream.codec_name : "unknown",
          audioCodec: audioStream ? audioStream.codec_name : "unknown",
        });
      });
    });
  }

  // Obtener el mejor codec de video disponible
  static async getBestVideoCodec(): Promise<string> {
    return new Promise((resolve) => {
      ffmpeg.getAvailableCodecs((err, codecs) => {
        if (err || !codecs["libx265"] || !codecs["libx265"].canEncode) {
          resolve("libx264");
        } else {
          resolve("libx265");
        }
      });
    });
  }

  // Limpiar segmentos viejos
  static cleanOldSegments(
    sessionId: string,
    currentSegment: number,
    quality: Quality
  ): void {
    fs.readdir(this.OUTPUT_DIR, (err, files) => {
      if (err) return;
      files.forEach((file) => {
        const match = file.match(new RegExp(`${sessionId}_${quality}_(\\d+)_`));
        if (match && parseInt(match[1]) < currentSegment - this.PRELOAD_LIMIT) {
          fs.unlink(path.join(this.OUTPUT_DIR, file), () => {});
        }
      });
    });
  }
}
