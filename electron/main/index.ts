import { nativeImage, app, Tray, Menu } from "electron";
import path from "path";
import fs from "fs-extra";
import os from "os";
import express from "express";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import multer from "multer";
import open from "open";
import cors from "cors";
import https from "https";
import { DataManager } from "../../src/data/utils/DataManager";
import propertiesReader from "properties-reader";
import { MovieDb } from "moviedb-promise";
import { Utils } from "../../src/data/utils/Utils";
import { Downloader } from "../../src/data/utils/Downloader";
import { WebSocketManager } from "../../src/data/utils/WebSocketManager";
import { Library } from "../../src/data/objects/Library";
import { fileURLToPath } from "url";
import { MovieDBWrapper } from "../../src/data/utils/MovieDB";
import { FileSearch } from "../../src/data/utils/FileSearch";
import VideoServer from "../../src/data/utils/VideoServer";

interface Session {
  tempDir: string;
  ffmpegProcess: ffmpeg.FfmpegCommand;
}

const sessions = new Map<string, Session>();

// Get current directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "../../");

// External path
const extPath = app.isPackaged
  ? path.dirname(app.getPath("exe"))
  : app.getAppPath();

const createFolder = (folder: string) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }
};

// Get resources folder path
const resourcesPath = path.join(extPath, "resources");
const propertiesFilePath = path.join(
  extPath,
  "resources",
  "config",
  "keys.properties"
);

if (!fs.existsSync(propertiesFilePath)) {
  fs.writeFileSync(propertiesFilePath, "");
}

// Create resources and config folders
createFolder(path.join(extPath, "resources"));
createFolder(path.join(extPath, "resources/config"));

// Create config.json if it doesn't exist
if (!fs.existsSync(path.join(extPath, "resources", "config", "config.json"))) {
  fs.writeFileSync(
    path.join(extPath, "resources", "config", "config.json"),
    JSON.stringify({ language: "es-ES" }, null, 2),
    "utf-8"
  );
}

// Create keys.properties if it doesn't exist
if (
  !fs.existsSync(path.join(extPath, "resources", "config", "keys.properties"))
) {
  fs.writeFileSync(
    path.join(extPath, "resources", "config", "keys.properties"),
    JSON.stringify({ language: "es-ES" }, null, 2),
    "utf-8"
  );
}

// Initialize folders
DataManager.initFolders();

// Initialize MoveDB Connection
const initMoveDBConnection = () => {
  MovieDBWrapper.initConnection();
};

initMoveDBConnection();

// Read properties file
const properties = propertiesReader(propertiesFilePath) || undefined;

// Get API Key
let THEMOVIEDB_API_KEY = properties.get("TMDB_API_KEY") || "";

// Server settings
const appServer = express();
const PORT = 3000;

// Middleware to allow CORS
appServer.use(
  cors({
    origin: "*",
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
  })
);

// Middleware to process JSON
appServer.use(express.json({ limit: "50mb" }));
appServer.use(express.urlencoded({ limit: "50mb" }));

// Multer configuration to store files on disk
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    console.log({
      storagePath: req.body.destPath,
    });
    const destPath =
      path.join(resourcesPath, req.body.destPath) ||
      path.join(resourcesPath, "img", "DownloadCache"); // Destination path received from client or default
    // Create folder if it doesn't exist
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    cb(null, destPath);
  },
  filename: (_req, file, cb) => {
    cb(null, file.originalname); // Usar el nombre original del archivo
  },
});

// Function to upload files from client
const upload = multer({ storage });

// Configure ffmpeg path
ffmpeg.setFfmpegPath(ffmpegPath || "");

ffmpeg.getAvailableCodecs((err, codecs) => {
  if (err) {
    console.error("Error checking codecs:", err);
    return;
  }

  console.log("Codecs disponibles:", codecs["libx265"]);
  // Verificar si H.265 está disponible
  const h265Supported = codecs["libx265"] && codecs["libx265"].canEncode;

  console.log({
    h265: h265Supported,
    cpuCores: os.cpus().length,
  });
  // resolve({
  //   h265: h265Supported,
  //   cpuCores: os.cpus().length,
  // });
});

//#region GET FOLDERS
// Function to get drives in the system
const getDrives = () => {
  const drives = [];
  const platform = os.platform();

  // Obtener el directorio del usuario actual
  const userHome = os.homedir();
  drives.push(userHome); // Agregar el directorio del usuario como el primer elemento

  if (platform === "win32") {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < letters.length; i++) {
      const drive = `${letters[i]}:\\`;
      if (fs.existsSync(drive)) {
        drives.push(drive);
      }
    }
  } else {
    // Para sistemas Unix-like como macOS o Linux
    drives.push("/"); // Añadir el directorio raíz
    const volumes = "/Volumes"; // En macOS, los volúmenes externos están en /Volumes
    if (fs.existsSync(volumes)) {
      const mountedVolumes = fs.readdirSync(volumes);
      mountedVolumes.forEach((volume) => {
        drives.push(path.join(volumes, volume)); // Añadir cada volumen montado
      });
    }
  }

  return drives;
};

// Endpoint to get drives
appServer.get("/drives", (req, res) => {
  const drives = getDrives();
  res.json(drives);
});

// Function to get files and folders within a directory
const getFolderContent = (dirPath: string) => {
  const contents: { name: string; isFolder: boolean }[] = [];
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  items.forEach((item) => {
    // Filter hidden files and folders
    if (item.name.startsWith(".")) return;

    if (item.isDirectory()) {
      contents.push({ name: item.name, isFolder: true });
    } else {
      contents.push({ name: item.name, isFolder: false });
    }
  });

  // Order: folders first, then files, alphabetically
  contents.sort((a, b) => {
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    return a.name.localeCompare(b.name);
  });

  return contents;
};

// Endpoint to get files and folders within a directory
appServer.get("/folder/*", (req: any, res: any) => {
  const folderPath = req.params[0]; // Extract the folder path from the URL
  const fullPath = path.resolve(folderPath); // Assert the path is absolute

  // Check if the folder exists
  if (!fs.existsSync(fullPath) || !fs.lstatSync(fullPath).isDirectory()) {
    return res.status(400).json({ error: "Invalid folder path" });
  }

  try {
    const content = getFolderContent(fullPath);
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: "Error reading folder" });
  }
});
//#endregion

//#region GET DATA
// Check server status
appServer.get("/", (_req, res) => {
  if (THEMOVIEDB_API_KEY) {
    const moviedb = new MovieDb(String(THEMOVIEDB_API_KEY));

    res.json({
      status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  } else {
    res.json({
      status: "INVALID_API_KEY",
    });
  }
});

// Serve images to outside
appServer.use("/img", express.static(path.join(resourcesPath, "img")));

// Get libraries
appServer.get("/libraries", (_req, res) => {
  const data = DataManager.loadData();
  res.json(data);
});

// Get audio file in user drive
appServer.get("/audio", (req: any, res: any) => {
  // Ruta absoluta del audio, que puede estar en cualquier unidad
  const audioPath = decodeURIComponent(req.query.path); // Pasar la ruta del audio como parámetro en la query

  if (typeof audioPath !== "string") {
    return res.status(400).send("Invalid audio path");
  }

  const stat = fs.statSync(audioPath);
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
    const file = fs.createReadStream(audioPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": (() => {
        const ext = path.extname(audioPath).toLowerCase();
        switch (ext) {
          case ".mp3":
            return "audio/mp3";
          case ".ogg":
            return "audio/ogg";
          case ".wav":
            return "audio/wav";
          case ".aac":
            return "audio/aac";
          case ".m4a":
            return "audio/m4a";
          case ".flac":
            return "audio/flac";
          default:
            return "audio/*";
        }
      })(),
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "audio/mp3",
    };
    res.writeHead(200, head);
    fs.createReadStream(audioPath).pipe(res);
  }
});

appServer.get("/video", (req: any, res: any) => {
  const filePath = req.query.path; // Ruta absoluta del archivo enviada por el cliente
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send("Archivo no encontrado");
  }

  const fileExt = path.extname(filePath).toLowerCase();
  const supportedFormats = [".mp4", ".mkv"]; // Formatos que manejarás

  if (!supportedFormats.includes(fileExt)) {
    return res.status(400).send("Formato no soportado");
  }

  // Obtener información del navegador (User-Agent) o del cliente para determinar compatibilidad
  const needsTranscoding = checkIfTranscodingNeeded(filePath);

  if (!needsTranscoding) {
    // Si no necesita transcodificación, sirve el archivo directamente con soporte para range requests
    serveFileDirectly(filePath, req, res);
  } else {
    // Si necesita transcodificación, usa FFmpeg para transmitir en tiempo real
    transcodeAndStream(filePath, res);
  }
});

// Función para verificar si se necesita transcodificación
function checkIfTranscodingNeeded(filePath: string) {
  // Aquí puedes usar ffprobe (viene con FFmpeg) para analizar codecs
  // Por simplicidad, asumimos que si el archivo no es H.264/AAC, necesita transcodificación
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return resolve(true); // Si hay error, transcodifica por seguridad
      const videoCodec = metadata.streams.find(
        (s) => s.codec_type === "video"
      )?.codec_name;
      const audioCodec = metadata.streams.find(
        (s) => s.codec_type === "audio"
      )?.codec_name;

      // Navegadores modernos soportan H.264 y AAC por defecto
      const isCompatible = videoCodec === "h264" && audioCodec === "aac";
      resolve(!isCompatible);
    });
  });
}

// Sirve el archivo directamente con soporte para range requests
function serveFileDirectly(filePath: string, req: any, res: any) {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4", // Ajusta según el tipo de archivo
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
      "Accept-Ranges": "bytes",
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
}

// Transcodifica y transmite en tiempo real
function transcodeAndStream(filePath: string, res: any) {
  res.setHeader("Content-Type", "video/mp4");

  const proc = ffmpeg(filePath)
    .videoCodec("copy") // H.264 para máxima compatibilidad
    .audioCodec("aac") // AAC para audio
    .outputOptions("-preset veryfast") // Optimiza velocidad sobre calidad
    .format("mp4") // Formato de salida
    .outputOptions("-movflags frag_keyframe+empty_moov") // Para streaming
    .on("error", (err) => {
      console.error("Error en FFmpeg:", err);
      res.status(500).send("Error procesando el video");
    });

  // Pipe del stream de FFmpeg directamente a la respuesta
  proc.pipe(res, { end: true });
}

// VideoServer.initializeVideoServer(appServer);

// Get video file in user drive
// appServer.get("/video", (req: any, res: any) => {
//   // Ruta absoluta del vídeo, que puede estar en cualquier unidad
//   const videoPath = decodeURIComponent(req.query.path); // Pasar la ruta del vídeo como parámetro en la query

//   if (typeof videoPath !== "string") {
//     return res.status(400).send("Invalid video path");
//   }

//   const stat = fs.statSync(videoPath);
//   const fileSize = stat.size;
//   const range = req.headers.range;

//   if (range) {
//     const parts = range.replace(/bytes=/, "").split("-");
//     const start = parseInt(parts[0], 10);
//     const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

//     if (start >= fileSize) {
//       res
//         .status(416)
//         .send("Requested range not satisfiable\n" + start + " >= " + fileSize);
//       return;
//     }

//     const chunkSize = end - start + 1;
//     const file = fs.createReadStream(videoPath, { start, end });
//     const head = {
//       "Content-Range": `bytes ${start}-${end}/${fileSize}`,
//       "Accept-Ranges": "bytes",
//       "Content-Length": chunkSize,
//       "Content-Type": (() => {
//         const ext = path.extname(videoPath).toLowerCase();
//         switch (ext) {
//           case ".mkv":
//             return "video/x-matroska";
//           case ".m2ts":
//             return "video/MP2T";
//           case ".mp4":
//             return "video/mp4";
//           case ".webm":
//             return "video/webm";
//           case ".avi":
//             return "video/avi";
//           case ".mov":
//             return "video/quicktime";
//           default:
//             return "video/mp4"; // Unknown extension, fallback to MP4
//         }
//       })(),
//     };

//     res.writeHead(206, head);
//     file.pipe(res);
//   } else {
//     const head = {
//       "Content-Length": fileSize,
//       "Content-Type": "video/mp4",
//     };
//     res.writeHead(200, head);
//     fs.createReadStream(videoPath).pipe(res);
//   }
// });

// appServer.get("/stream", (req, res) => {
//   const videoPath = req.query.videoPath as string;
//   const start = (req.query.start as string) || "0";

//   if (!videoPath || !fs.existsSync(videoPath)) {
//     res.status(400).send("El archivo de vídeo no existe o la ruta es inválida");
//     return;
//   }

//   const sessionId = uuidv4();
//   const tempDir = path.join(os.tmpdir(), sessionId);
//   fs.mkdirSync(tempDir);

//   const playlistPath = path.join(tempDir, "playlist.m3u8");

//   const command = ffmpeg(videoPath)
//     .input(videoPath)
//     .setStartTime(parseFloat(start)) // Mover -ss después del input
//     .outputOptions([
//       "-c:v copy",
//       "-c:a aac",
//       "-f hls",
//       "-hls_time 10",
//       "-hls_list_size 5",
//       "-hls_flags delete_segments",
//       `-hls_segment_filename ${path.join(tempDir, "segment_%03d.ts")}`,
//     ])
//     .output(playlistPath)
//     .on("start", (commandLine) => {
//       console.log("ffmpeg iniciado con: " + commandLine);
//     })
//     .on("stderr", (stderrLine) => {
//       console.error("ffmpeg stderr: " + stderrLine); // Capturar stderr para más información
//     })
//     .on("error", (err, stdout, stderr) => {
//       console.error("Error en ffmpeg: " + err.message);
//       console.error("ffmpeg stdout: " + stdout);
//       console.error("ffmpeg stderr: " + stderr); // Capturar stderr y stdout para más detalles
//     })
//     .on("end", () => {
//       console.log("Conversión ffmpeg finalizada.");
//     });

//   sessions.set(sessionId, { tempDir, ffmpegProcess: command });

//   // Ejecutar el comando ffmpeg
//   command.run();

//   const playlistUrl = `/stream/${sessionId}/playlist.m3u8`;
//   res.json({ playlistUrl });
// });

// appServer.get("/stream/:sessionId/:filename", (req, res) => {
//   const { sessionId, filename } = req.params;
//   const session = sessions.get(sessionId);

//   if (!session) {
//     res.status(404).send("Sesión no encontrada");
//     return;
//   }

//   const filePath = path.join(session.tempDir, filename);
//   if (fs.existsSync(filePath)) {
//     res.sendFile(filePath);
//   } else {
//     res.status(404).send("Archivo no disponible todavía");
//   }
// });

// Get images from folder
appServer.get("/images", (req: any, res: any) => {
  const imagesPath = decodeURIComponent(req.query.path);

  if (typeof imagesPath !== "string") {
    return res.status(400).send("Invalid images path");
  }

  fs.readdir(path.join(resourcesPath, imagesPath), (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error reading images folder");
    }

    const images = files.map((file) => {
      const filePath = path.join(imagesPath, file);
      return {
        name: file,
        url: filePath,
      };
    });

    res.json(images);
  });
});

// Get media info
appServer.get("/mediaInfo", async (req: any, res: any) => {
  const { libraryId, showId, seasonId, episodeId } = req.query;

  if (
    typeof libraryId !== "string" ||
    typeof showId !== "string" ||
    typeof seasonId !== "string" ||
    typeof episodeId !== "string"
  ) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const videoObject = await DataManager.getEpisode(
    libraryId,
    showId,
    seasonId,
    episodeId
  );

  if (!videoObject) return;

  const data = await Utils.getMediaInfo(videoObject);
  res.json(data);
});

// Get search videos results
appServer.get("/media/search", async (req: any, res: any) => {
  const { query } = req.query;

  if (typeof query !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const data = await Downloader.searchVideos(query, 20);
  res.json(data);
});

// Search shows in TheMovieDB
appServer.get("/shows/search", (req: any, res: any) => {
  const { name, year } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Param name not found" });
  }

  MovieDBWrapper.searchTVShows(name, year, 1).then((data) => res.json(data));
});

// Endpoint para comprimir y devolver una imagen
appServer.get("/compressImage", async (req: any, res: any) => {
  const { imagePath } = req.query;

  if (!imagePath || typeof imagePath !== "string") {
    return res
      .status(400)
      .json({ error: "Debes proporcionar una ruta válida a la imagen." });
  }

  // Eliminar los parámetros de la URL (como el timestamp)
  const cleanedImagePath = imagePath.split("?")[0]; // Obtiene la ruta sin el query string

  const imgPath = path.join(resourcesPath, cleanedImagePath);

  if (!fs.existsSync(imgPath)) {
    return res.status(404).json({ error: "La imagen especificada no existe." });
  }

  // Ruta de salida de la imagen comprimida
  const outputFilePath = path.join(
    extPath,
    "cache",
    cleanedImagePath.replace(path.extname(cleanedImagePath), ".avif")
  );

  // Verificar si la imagen comprimida ya existe en caché
  // if (fs.existsSync(outputFilePath)) {
  //   // Si existe, devolver la imagen desde el caché
  //   return res.sendFile(outputFilePath, (err: any) => {
  //     if (err) {
  //       console.error("Error al enviar el archivo:", err);
  //       return res
  //         .status(500)
  //         .json({ error: "Error al enviar la imagen comprimida." });
  //     }
  //   });
  // }

  // Crear las carpetas necesarias si no existen
  const outputDir = path.dirname(outputFilePath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const compressionQuality = 10; // Calidad de compresión

  try {
    // Redimensionar la imagen si es necesario
    const resizedImagePath = path.join(
      outputDir,
      "resized-" + path.basename(imgPath)
    );
    await Utils.resizeToMaxResolution(imgPath, resizedImagePath);

    // Comprimir la imagen con ffmpeg
    await new Promise<void>((resolve, reject) => {
      ffmpeg.setFfmpegPath(ffmpegPath || "");
      ffmpeg(resizedImagePath)
        .outputOptions([`-q:v ${Math.round((100 - compressionQuality) / 10)}`]) // Convertir calidad a escala de ffmpeg
        .output(outputFilePath)
        .outputFormat("avif")
        .on("end", () => {
          // Eliminar la imagen redimensionada temporal después de la compresión
          fs.unlinkSync(resizedImagePath);
          resolve();
        })
        .on("error", (err) => reject(err))
        .run();
    });

    // Enviar la imagen comprimida al cliente
    res.sendFile(outputFilePath, (err: any) => {
      if (err) {
        console.error("Error al enviar el archivo:", err);
        return res
          .status(500)
          .json({ error: "Error al enviar la imagen comprimida." });
      }
    });
  } catch (error) {
    console.error("Error al comprimir la imagen:", error);
    res.status(500).json({ error: "Error al comprimir la imagen." });
  }
});

// Search movies in TheMovieDB
appServer.get("/movies/search", (req: any, res: any) => {
  const { name, year } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Param name not found" });
  }

  MovieDBWrapper.searchMovies(name, year, 1).then((data) => res.json(data));
});

// Search episode groups in TheMovieDB
appServer.get("/episodeGroups/search", (req: any, res: any) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "Param id not found" });
  }

  MovieDBWrapper.searchEpisodeGroups(id).then((data) => res.json(data));
});
//#endregion

//#region UPDATE DATA

// Update Library
appServer.put("/library", (req, res) => {
  const { libraryId, updatedLibrary } = req.body;

  try {
    DataManager.updateLibrary(libraryId, updatedLibrary);
    res.status(200).json({ message: "Library updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update library" });
  }
});

// Update Show
appServer.put("/show", (req, res) => {
  const { libraryId, showId, updatedShow } = req.body;

  try {
    DataManager.updateShow(libraryId, showId, updatedShow);
    res.status(200).json({ message: "Show updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update show" });
  }
});

// Update Season
appServer.put("/season", (req, res) => {
  const { libraryId, showId, seasonId, updatedSeason } = req.body;

  try {
    DataManager.updateSeason(libraryId, showId, seasonId, updatedSeason);
    res.status(200).json({ message: "Season updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update season" });
  }
});

// Update Episode
appServer.put("/episode", (req, res) => {
  const { libraryId, showId, updatedEpisode } = req.body;

  try {
    DataManager.updateEpisode(libraryId, showId, updatedEpisode);
    res.status(200).json({ message: "Episode updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update episode" });
  }
});
//#endregion

//#region DELETE DATA

// Delete Library
appServer.delete("/libraries/:libraryId", (req, res) => {
  const { libraryId } = req.params;

  console.log(libraryId);

  try {
    DataManager.deleteLibrary(libraryId);
    res.status(200).json({ message: "Library deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete library" });
  }
});

// Delete Show
appServer.delete("/libraries/:libraryId/shows/:showId", (req, res) => {
  const { libraryId, showId } = req.params;

  try {
    DataManager.deleteShow(libraryId, showId);
    res.status(200).json({ message: "Show deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete show" });
  }
});

// Delete Season
appServer.delete(
  "/libraries/:libraryId/shows/:showId/seasons/:seasonId",
  (req, res) => {
    const { libraryId, showId, seasonId } = req.params;

    try {
      DataManager.deleteSeason(libraryId, showId, seasonId);
      res.status(200).json({ message: "Season deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete season" });
    }
  }
);

// Delete Episode
appServer.delete(
  "/libraries/:libraryId/shows/:showId/seasons/:seasonId/episodes/:episodeId",
  (req, res) => {
    const { libraryId, showId, seasonId, episodeId } = req.params;

    try {
      DataManager.deleteEpisode(libraryId, showId, seasonId, episodeId);
      res.status(200).json({ message: "Episode deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete episode" });
    }
  }
);
//#endregion

//#region POST DATA
appServer.post("/api-key", (req, res) => {
  const { apiKey } = req.body;
  // Save API key in properties file
  properties.set("TMDB_API_KEY", apiKey);
  properties.save(propertiesFilePath);

  if (apiKey) {
    const moviedb = new MovieDb(String(apiKey));

    THEMOVIEDB_API_KEY = apiKey;

    res.json({
      status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  } else {
    res.json({
      status: "INVALID_API_KEY",
    });
  }
});

// Add library
appServer.post("/addLibrary", (req, _res) => {
  const libraryData = req.body;

  if (!libraryData) return;

  const library = Library.fromLibraryData(libraryData);

  FileSearch.scanFiles(library, wsManager);
});

// Upload image
appServer.post("/uploadImage", upload.single("image"), (req: any, res: any) => {
  console.log("Campos de la solicitud:", req.body);
  const file = req.file;
  const destPath = req.body.destPath;

  if (!file) {
    return res.status(400).send("No file received");
  }

  if (!destPath) {
    return res.status(400).send("Destination path not specified");
  }

  // Success response
  res
    .status(200)
    .send(
      `Image uploaded successfully to ${path.join(destPath, file.originalname)}`
    );
});

// Download image
appServer.post("/downloadImage", async (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  await Utils.downloadImage(
    url,
    path.join(resourcesPath, downloadFolder, fileName)
  );

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Download video
appServer.post("/downloadVideo", async (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  await Downloader.downloadVideo(url, downloadFolder, fileName, wsManager);

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Download music
appServer.post("/downloadMusic", (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  Downloader.downloadAudio(url, downloadFolder, fileName, wsManager);

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Update TheMovieDB id for show
appServer.post("/updateShowId", (req: any, res: any) => {
  const { libraryId, showId, themdbId } = req.body;

  if (!showId || !themdbId || !libraryId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  FileSearch.updateShowMetadata(libraryId, showId, themdbId, wsManager);
});

// Update TheMovieDB id for movie
appServer.post("/updateMovieId", (req: any, res: any) => {
  const { libraryId, collectionId, seasonId, themdbId } = req.body;

  if (!collectionId || !themdbId || !libraryId || !seasonId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  FileSearch.updateMovieMetadata(
    libraryId,
    collectionId,
    seasonId,
    themdbId,
    wsManager
  );
});

// Update episode group for show
appServer.post("/updateEpisodeGroup", (req: any, res: any) => {
  const { libraryId, showId, themdbId, episodeGroupId } = req.body;

  if (!showId || !themdbId || !episodeGroupId || !libraryId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  FileSearch.updateShowMetadata(
    libraryId,
    showId,
    themdbId,
    wsManager,
    episodeGroupId
  );
});
//#endregion

//#region CREATE HTTP SERVER
const server = https.createServer(
  {
    cert: fs.readFileSync("./certificate.pem"),
    key: fs.readFileSync("./certificate.key"),
  },
  appServer
);

// Create WebSocket Manager
const wsManager = WebSocketManager.getInstance(server);

// Start server
server.listen(PORT, () => {
  console.log(`Streaming server running at https://localhost:${PORT}`);
});
//#endregion

//#region TRAY
let tray: Tray;

// Create Tray and configure Menu
app.whenReady().then(() => {
  const iconPath = path.join("public", "icon.png");
  const image = nativeImage.createFromPath(iconPath);
  tray = new Tray(image);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Seerial",
      click: () => {
        // Open in browser
        open("https://app.seerial.es/");
      },
    },
    {
      label: "Exit",
      click: () => app.quit(),
    },
  ]);

  tray.setToolTip("Seerial Media Server");
  tray.setContextMenu(contextMenu);
});
//#endregion

// Close app when all windows are closed (Windows, not MacOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
