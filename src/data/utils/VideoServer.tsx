import { Express, Response } from "express";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobePath from "ffprobe-static";
import { fileURLToPath } from "url";

// Tipos para los codecs y configuraciones
type ResolutionKey = "480p" | "720p" | "1080p";
type Bitrate =
  | 200
  | 300
  | 700
  | 1500
  | 2000
  | 3000
  | 4000
  | 8000
  | 10000
  | 12000
  | 15000
  | 20000;
type Quality = ResolutionKey | "original";

interface ResolutionConfig {
  width: number;
  height: number;
  videoBitrate: string;
  audioBitrate: string;
}

// Get current directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class VideoServer {
  static appServer: Express | null = null;
  static ENABLE_TRANSCODING: boolean = true;

  static RESOLUTIONS: Record<ResolutionKey, ResolutionConfig> = {
    "480p": {
      width: 720,
      height: 480,
      videoBitrate: "1000",
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

  /**
   * Initializes the video server.
   *
   * This function configures the Express server to serve videos directly or
   * convert them to a format compatible with the current browser.
   *
   * @param {Express} server The Express server to be initialized.
   */
  public static initializeVideoServer(server: Express): void {
    this.appServer = server;

    ffmpeg.setFfmpegPath(ffmpegPath || "");
    ffmpeg.setFfprobePath(ffprobePath.path || "");

    this.appServer.get(
      "/video",
      async (req: any, res: Response): Promise<any> => {
        const {
          path: videoPath,
          start = 0,
          quality = "original",
          bitrate,
        } = req.query;

        if (!videoPath || !fs.existsSync(videoPath)) {
          return res.status(404).send("File not found");
        }

        if (quality === "original") {
          const codecsCompatibility = await this.checkCodecCompatibility(
            videoPath
          );

          if (
            codecsCompatibility.videoCompatibility &&
            codecsCompatibility.audioCompatibility
          ) {
            this.serveFileDirectly(videoPath, req, res);
          } else {
            if (this.ENABLE_TRANSCODING) {
              this.handleCustomQuality(videoPath, start, quality, res);
            } else {
              return res.status(400).send("Transcoding is disabled");
            }
          }
        } else if (
          this.RESOLUTIONS[quality as ResolutionKey] ||
          quality !== "original"
        ) {
          this.handleCustomQuality(
            videoPath,
            start,
            quality as ResolutionKey,
            res
          );
        } else {
          res.status(400).send("Invalid quality option");
        }
      }
    );

    this.appServer.get("/metadata", async (req: any, res: any) => {
      const filePath = req.query.path;
      if (!filePath || !fs.existsSync(filePath)) {
        return res.status(404).send("Archivo no encontrado");
      }

      try {
        const metadata: any = await this.getMetadata(filePath);
        res.json({
          duration: metadata.format.duration,
          audioTracks: metadata.streams
            .filter((s: any) => s.codec_type === "audio")
            .map((s: any) => ({
              index: s.index,
              language: s.tags?.language || "unknown",
            })),
          subtitleTracks: metadata.streams
            .filter((s: any) => s.codec_type === "subtitle")
            .map((s: any) => ({
              index: s.index,
              language: s.tags?.language || "unknown",
            })),
        });
      } catch (error) {
        res.status(500).send("Error obteniendo metadatos");
      }
    });
  }

  /**
   * Serves a video file without transcoding.
   * @param filePath The path to the video file to be served.
   * @param req The express request object, containing details of the HTTP request.
   * @param res The express response object, used to send back the desired HTTP response.
   */
  static serveFileDirectly(filePath: string, req: any, res: any) {
    try {
      // Verificar si el archivo existe y obtener sus estadísticas
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      // Configurar el tipo de contenido (puedes ajustarlo según el archivo real)
      const videoMimeType = "video/mp4"; // Podrías usar una librería como 'mime-types' para detectarlo dinámicamente

      if (range) {
        // Manejo de solicitud parcial (HTTP 206)
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

        // Validar rangos
        if (start >= fileSize || end >= fileSize || start > end) {
          res.writeHead(416, {
            "Content-Range": `bytes */${fileSize}`,
          });
          return res.end();
        }

        const chunksize = end - start + 1;
        const fileStream = fs.createReadStream(filePath, {
          start,
          end,
          highWaterMark: 64 * 1024, // Aumentar el tamaño del búfer a 64KB
        });

        const headers = {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize.toString(),
          "Content-Type": videoMimeType,
        };

        res.writeHead(206, headers);

        // Pipe con control de errores
        fileStream.pipe(res).on("error", (err: any) => {
          console.error("Error en el stream:", err);
          res.status(500).end();
        });
      } else {
        // Solicitud completa (HTTP 200)
        const headers = {
          "Content-Length": fileSize.toString(),
          "Content-Type": videoMimeType,
          "Accept-Ranges": "bytes",
        };

        res.writeHead(200, headers);
        const fileStream = fs.createReadStream(filePath, {
          highWaterMark: 64 * 1024, // Aumentar el tamaño del búfer
        });

        fileStream.pipe(res).on("error", (err: any) => {
          console.error("Error en el stream:", err);
          res.status(500).end();
        });
      }

      // Manejar el cierre del cliente
      req.on("close", () => {
        res.end();
      });
    } catch (err) {
      console.error("Error al servir el archivo:", err);
      res.status(500).send("Error interno del servidor");
    }
  }

  /**
   * Handles a request for a custom quality video stream
   * @param videoPath The path to the video file
   * @param start The start time of the video in seconds
   * @param quality The quality of the video stream
   * @param res The express response object
   */
  static async handleCustomQuality(
    videoPath: string,
    start: number,
    quality: ResolutionKey,
    res: Response
  ): Promise<void> {
    res.setHeader("Content-Type", "video/mp4");

    const audioCodec = await this.getBestAudioCodec();

    const proc = ffmpeg(videoPath)
      .setStartTime(start)
      .videoCodec("copy")
      .audioCodec(audioCodec)
      .audioBitrate(audioCodec === "opus" ? "192k" : "256k")
      .outputOptions("-preset veryfast")
      .format("mp4")
      .outputOptions([
        "-movflags frag_keyframe+empty_moov+faststart", // Optimización para streaming
        "-frag_duration 1000000", // Fragmentos de 1 segundo
      ]) // Send streaming fragments
      .on("start", (commandLine) => {
        console.log("FFmpeg iniciado con comando:", commandLine);
      })
      .on("progress", (progress) => {
        console.log("Progreso:", progress.percent, "%");
      })
      .on("end", () => {
        console.log("Procesamiento completado");
      })
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        res.status(500).send("Video processing error");
      });

    // FFmpeg streaming pipe to send video fragments
    proc.pipe(res, { end: true });
  }

  /**
   * Checks if the codecs of a video file are compatible with the HTML5 video player
   * @param videoPath The path to the video file
   * @returns An object with separate video and audio compatibility results
   */
  static async checkCodecCompatibility(videoPath: string): Promise<{
    videoCompatibility: boolean;
    audioCompatibility: boolean;
  }> {
    try {
      // Retrieve the original codecs using the existing function
      const { videoCodec, audioCodec } = await this.getOriginalCodecs(
        videoPath
      );

      return {
        videoCompatibility: videoCodec
          ? this.COMPATIBLE_VIDEO_CODECS.includes(videoCodec.toLowerCase())
          : false,
        audioCompatibility: audioCodec
          ? this.COMPATIBLE_AUDIO_CODECS.includes(audioCodec.toLowerCase())
          : false,
      };
    } catch (error: any) {
      throw new Error(`Error vefirying codec compatibility: ${error.message}`);
    }
  }

  /**
   * Retrieves the original video and audio codecs of a given video file.
   * @param videoPath The path to the video file.
   * @returns A promise resolving to an object containing the video and audio codec names.
   */
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

  /**
   * Retrieves the best video codec available in the system, prioritizing H.265 (HEVC) if available.
   * @returns A promise resolving to the best video codec name.
   */
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

  /**
   * Retrieves the best audio codec available in the system, prioritizing Opus if available.
   * @returns A promise resolving to the best audio codec name.
   */
  static async getBestAudioCodec(): Promise<string> {
    return new Promise((resolve) => {
      ffmpeg.getAvailableCodecs((err, codecs) => {
        if (err || !codecs["opus"] || !codecs["opus"].canEncode) {
          resolve("opus");
        } else {
          resolve("aac");
        }
      });
    });
  }

  // Nueva función para obtener metadatos
  static async getMetadata(filePath: string) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) reject(err);
        else resolve(metadata);
      });
    });
  }
}
