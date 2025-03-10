import { nativeImage, app, Tray, Menu } from "electron";
import path from "path";
import express from "express";
import open from "open";
import cors from "cors";
import http from "http";
import * as routes from "../../src/routes/index";
import { FilesManager } from "../../src/data/utils/FilesManager";
import { WebSocketManager } from "../../src/data/utils/WebSocketManager";
import { fileURLToPath } from "url";
import { MovieDBWrapper } from "../../src/data/utils/MovieDB";
import VideoServer from "../../src/data/utils/VideoServer";

// Get current directory path
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load https certificates
const keyPath = path.join(__dirname, "certs", "key.pem");
const certPath = path.join(__dirname, "certs", "cert.pem");

process.env.APP_ROOT = path.join(__dirname, "../../");

// Initialize Folders
FilesManager.initFolders();

// Load properties file
FilesManager.loadProperties();

// Initialize MoveDB Connection
MovieDBWrapper.initConnection();

// Server settings
export const appServer = express();
const PORT = 34200;

// Middleware to allow CORS
appServer.use(
  cors({
    origin: "*",
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
  })
);

// Middleware to process JSON
appServer.use(express.json({ limit: "50mb" }));
appServer.use(express.urlencoded({ limit: "50mb", extended: true }));

// Create HTTP Server
export const server = http.createServer(appServer);

// Create WebSocket Manager
export const wsManager = WebSocketManager.getInstance(server);

// Start server
server.listen(PORT, () => {
  console.log(`Streaming server running at http://localhost:${PORT}`);
});

// Initialize video server
VideoServer.initializeVideoServer(appServer);

// Add all routes
appServer.use("/", routes.folderRoutes);
appServer.use("/", routes.deleteDataRoutes);
appServer.use("/", routes.postDataRoutes);
appServer.use("/", routes.updateDataRoutes);
appServer.use("/", routes.getAudioRoutes);
appServer.use("/", routes.getImagesRoutes);
appServer.use("/", routes.getMediaRoutes);
appServer.use("/", routes.getMediaInfoRoutes);
appServer.use("/", routes.getStatusRoutes);
appServer.use("/", routes.getVideoRoutes);

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

// Close app when all windows are closed (Windows, not MacOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
