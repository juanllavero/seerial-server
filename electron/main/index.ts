import { nativeImage, app, Tray, Menu } from "electron";
import path from "path";
import fs from "fs-extra";
import os from "os";
import express from "express";
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
}

initMoveDBConnection();

// Read properties file
const properties = propertiesReader(propertiesFilePath) || undefined;

// Get API Key
let THEMOVIEDB_API_KEY = properties.get("TMDB_API_KEY") || "";
let validApiKey = false;

// Server settings
const appServer = express();
const PORT = 3000;

// Middleware to process JSON
appServer.use(express.json());

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

    validApiKey = moviedb != undefined;

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

// Get media info
appServer.get(
  "/mediaInfo/:libraryId/:showId/:seasonId/:episodeId",
  async (req, res) => {
    const { libraryId, showId, seasonId, episodeId } = req.params;

    // console.log(libraryId, "/", showId, "/", seasonId, "/", episodeId);

    // const videoObject = await DataManager.getEpisode(
    //   libraryId,
    //   showId,
    //   seasonId,
    //   episodeId
    // );

    // if (!videoObject) return;

    const data = await Utils.getMediaInfo({
      id: "5c7d4ef0-ac25-4fa9-8b3e-1aec77596a22",
      name: "Sesión espiritista",
      overview:
        "En busca de respuestas, Vanessa y Sir Malcolm asisten a una fiesta en el hogar del egiptólogo Sir Ferdinand Lyle, donde se encuentran con el misteriosamente hermoso Dorian Gray. La fiesta da un giro inesperado, sin embargo, cuando la reconocida clarividente Madame Kali realiza una sesión espiritista. Mientras tanto, Ethan traba amistad con Brona Croft, una joven inmigrante irlandesa.",
      year: "2014-05-18",
      nameLock: false,
      yearLock: false,
      overviewLock: false,
      imdbScore: 0,
      score: 7.3,
      directedBy: ["J. A. Bayona"],
      writtenBy: ["John Logan"],
      directedLock: false,
      writtenLock: false,
      album: "",
      albumArtist: "",
      order: 0,
      runtime: 56,
      runtimeInSeconds: 3335.36,
      episodeNumber: 2,
      seasonNumber: 1,
      videoSrc: "F:\\SeriesTest\\Penny Dreadful\\S1\\Penny Dreadful S01E02.mkv",
      imgSrc: "img/thumbnails/video/5c7d4ef0-ac25-4fa9-8b3e-1aec77596a22/0.jpg",
      imgUrls: [],
      seasonID: "b3b80f5f-c8aa-414b-bf0c-ec5a7c1641da",
      watched: false,
      timeWatched: 0,
      chapters: [],
      mediaInfo: undefined,
      videoTracks: [],
      audioTracks: [],
      subtitleTracks: [],
    });
    res.json(data);
  }
);

// Get search videos results
appServer.get("/searchMedia/:query", async (req, res) => {
  const { query } = req.params;
  const data = await Downloader.searchVideos(query, 20);
  res.json(data);
});

// Get search shows results
// appServer.get("/searchShows/:query", (req, res) => {
//   const { query } = req.params;
//   const data = DataManager.searchShows(query);
//   res.json(data);
// });

// Get search movies results
// appServer.get("/searchMovies/:query", (req, res) => {
//   const { query } = req.params;
//   const data = DataManager.searchMovies(query);
//   res.json(data);
// });

// Get search episode groups results
// appServer.get("/searchEpisodeGroups/:query", (req, res) => {
//   const { query } = req.params;
//   const data = DataManager.searchEpisodeGroups(query);
//   res.json(data);
// });
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

// Download video
appServer.post("/downloadVideo", (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  console.log(url, downloadFolder, fileName);

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  console.log(`Iniciando la descarga del vídeo desde URL: ${url}`);

  Downloader.downloadVideo(url, downloadFolder, fileName, wsManager);

  res.json({ message: 'Descarga iniciada' });
});

// Download music
appServer.post("/downloadMusic", (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: 'Faltan parámetros' });
  }

  console.log(`Iniciando la descarga del vídeo desde URL: ${url}`);

  Downloader.downloadAudio(url, downloadFolder, fileName, wsManager);

  res.json({ message: 'Descarga iniciada' });
});
//#endregion

//#region CREATE HTTP SERVER
const server = http.createServer(appServer);

// Create WebSocket Manager
const wsManager = WebSocketManager.getInstance(server);

// Start server
server.listen(PORT, () => {
  console.log(`Servidor de streaming corriendo en http://localhost:${PORT}`);
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
