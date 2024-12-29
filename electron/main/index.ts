import { nativeImage, app, Tray, Menu } from "electron";
import path from "path";
import fs from "fs-extra";
import os from "os";
import express from "express";
import multer from 'multer';
import open from "open"; // Open in browser
import http from "http";
import { DataManager } from "../../src/data/utils/DataManager";
import propertiesReader from "properties-reader";
import { MovieDb } from "moviedb-promise";
import { Utils } from "../../src/data/utils/Utils";
import { Downloader } from "../../src/data/utils/Downloader";
import { WebSocketManager } from "../../src/data/utils/WebSocketManager";
import { Library } from "../../src/data/objects/Library";
import { fileURLToPath } from "url";

// Get current directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(__dirname, "../../");

// if (!fs.existsSync(propertiesFilePath)) {
// 	fs.writeFileSync(propertiesFilePath, "");
// }

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

const initMoveDBConnection = () => {
  DataManager.initConnection();
};

initMoveDBConnection();

// Read properties file
const properties = propertiesReader(propertiesFilePath) || undefined;

// Get API Key
let THEMOVIEDB_API_KEY = properties.get("TMDB_API_KEY") || "";

// Server settings
const appServer = express();
const PORT = 3000;

// Middleware to process JSON
appServer.use(express.json());

// Multer configuration to store files on disk
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    console.log({
      storagePath: req.body.destPath,
    });
    const destPath = path.join(resourcesPath, req.body.destPath) || path.join(resourcesPath, 'img', 'DownloadCache'); // Destination path received from client or default
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

// Get video file in user drive
appServer.get("/video", (req: any, res: any) => {
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

  DataManager.searchShows(name, year).then((data) => res.json(data));
});

// Search movies in TheMovieDB
appServer.get("/movies/search", (req: any, res: any) => {
  const { name, year } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Param name not found" });
  }

  DataManager.searchMovies(name, year).then((data) => res.json(data));
});

// Search episode groups in TheMovieDB
appServer.get("/episodeGroups/search", (req: any, res: any) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "Param id not found" });
  }

  DataManager.searchEpisodeGroups(id).then((data) => res.json(data));
});
//#endregion

//#region UPDATE DATA

// Update Library
appServer.put("/libraries/:libraryId", (req, res) => {
  const { libraryId } = req.params;
  const updatedLibrary = req.body;

  try {
    DataManager.updateLibrary(libraryId, updatedLibrary);
    res.status(200).json({ message: "Library updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update library" });
  }
});

// Update Show
appServer.put("/libraries/:libraryId/shows/:showId", (req, res) => {
  const { libraryId, showId } = req.params;
  const updatedShow = req.body;

  try {
    DataManager.updateShow(libraryId, showId, updatedShow);
    res.status(200).json({ message: "Show updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update show" });
  }
});

// Update Season
appServer.put(
  "/libraries/:libraryId/shows/:showId/seasons/:seasonId",
  (req, res) => {
    const { libraryId, showId, seasonId } = req.params;
    const updatedSeason = req.body;

    try {
      DataManager.updateSeason(libraryId, showId, seasonId, updatedSeason);
      res.status(200).json({ message: "Season updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update season" });
    }
  }
);

// Update Episode
appServer.put(
  "/libraries/:libraryId/shows/:showId/seasons/:seasonId/episodes/:episodeId",
  (req, res) => {
    const { libraryId, showId } = req.params;
    const updatedEpisode = req.body;

    try {
      DataManager.updateEpisode(libraryId, showId, updatedEpisode);
      res.status(200).json({ message: "Episode updated successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update episode" });
    }
  }
);
//#endregion

//#region DELETE DATA

// Delete Library
appServer.delete("/libraries/:libraryId", (req, res) => {
  const { libraryId } = req.params;

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

  DataManager.scanFiles(library, wsManager);
});

// Upload image
appServer.post('/uploadImage', upload.single('image'), (req: any, res: any) => {
  console.log("Campos de la solicitud:", req.body);
  const file = req.file;
  const destPath = req.body.destPath;

  if (!file) {
    return res.status(400).send('No file received');
  }

  if (!destPath) {
    return res.status(400).send('Destination path not specified');
  }

  // Success response
  res.status(200).send(`Image uploaded successfully to ${path.join(destPath, file.originalname)}`);
});

// Download image
appServer.post("/downloadImage", async (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  await Utils.downloadImage(url, path.join(resourcesPath, downloadFolder, fileName));

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

  DataManager.updateShowMetadata(libraryId, showId, themdbId, wsManager);
});

// Update TheMovieDB id for movie
appServer.post("/updateMovieId", (req: any, res: any) => {
  const { libraryId, collectionId, seasonId, themdbId } = req.body;

  if (!collectionId || !themdbId || !libraryId || !seasonId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  DataManager.updateMovieMetadata(
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

  DataManager.updateShowMetadata(
    libraryId,
    showId,
    themdbId,
    wsManager,
    episodeGroupId
  );
});
//#endregion

//#region CREATE HTTP SERVER
const server = http.createServer(appServer);

// Create WebSocket Manager
const wsManager = WebSocketManager.getInstance(server);

// Start server
server.listen(PORT, () => {
  console.log(`Streaming server running at http://localhost:${PORT}`);
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
        open("http://www.seerial.es");
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
