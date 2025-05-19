import cors from "cors";
import { app, Menu, shell, Tray } from "electron";
import express from "express";
import http from "http";
import path from "path";
import { SequelizeManager } from "./db/SequelizeManager";
import * as routes from "./routes/index";
import { MovieDBWrapper } from "./theMovieDB/MovieDB";
import { checkDependencies } from "./utils/DependenciesCheck";
import { FilesManager } from "./utils/FilesManager";
import { WebSocketManager } from "./WebSockets/WebSocketManager";

process.env.APP_ROOT = path.join(__dirname, "../../");

// Initialize Database
SequelizeManager.initializeDB();

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
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "authorization"],
  })
);

// appServer.use((_req, res) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Expose-Headers", "x-total-count");
//   res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH");
//   res.header("Access-Control-Allow-Headers", "Content-Type,authorization");
// });

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
appServer.use("/", routes.getHTPCSettings);
appServer.use("/", routes.getServerSettings);
appServer.use("/", routes.getWebSettings);

//#region TRAY ICON
let tray: Tray | null = null;
function createTray() {
  const iconPath = path.join(
    __dirname,
    "assets",
    process.platform === "win32" ? "icon.ico" : "icon.png"
  );

  tray = new Tray(iconPath);

  // Obtener estado actual del inicio automático
  const loginSettings = app.getLoginItemSettings();
  let startAtLoginChecked = loginSettings.openAtLogin;

  // Context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open Seerial...",
      click: () => {
        shell.openExternal("https://app.seerial.es");
      },
    },
    { type: "separator" },
    {
      label: "Start Seerial Media Server at Login",
      type: "checkbox",
      checked: startAtLoginChecked,
      click: (menuItem) => {
        const enabled = menuItem.checked;
        app.setLoginItemSettings({
          openAtLogin: enabled,
          path: process.execPath,
          args: [], // start args if necessary
        });
        startAtLoginChecked = enabled;
      },
    },
    { type: "separator" },
    {
      label: "About Seerial",
      click: () => {
        shell.openExternal("https://seerial.es");
      },
    },
    {
      label: "Exit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Seerial App");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    // Do nothing
  });

  tray.on("double-click", () => {
    shell.openExternal("https://app.seerial.es");
  });
}
//#endregion

// Start the app
app.whenReady().then(async () => {
  // Check dependencies and install if necessary (python, pip, yt-dl)
  await checkDependencies();

  // Create Tray icon
  createTray();

  app.on("activate", () => {
    if (!tray) createTray();
  });
});

// Avoid quitting the app when all windows are closed for macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
