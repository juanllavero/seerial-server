import { addServerRoutes } from "@/initialization/AddRoutes";
import { createTray } from "@/initialization/CreateTray";
import * as ConfigManager from "@/managers/ConfigManager";
import { FilesManager } from "@/managers/FilesManager";
import { SequelizeManager } from "@/managers/SequelizeManager";
import { ServerConfigManager } from "@/managers/ServerConfigManager";
import { WebSocketManager } from "@/managers/WebSocketManager";
import { MovieDBWrapper } from "@/theMovieDB/MovieDB";
import { downloadYtDlp } from "@/utils/YoutubeDownloader";
import cors from "cors";
import { config } from "dotenv";
import { app } from "electron";
import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import http from "http";
import https from "https";
import path from "path";

// Initialize app and environment
config();
process.env.APP_ROOT = path.join(__dirname, "../../");
export const appServer = express();

// Middleware
appServer.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Curl or server side requests
      callback(null, origin); // Return same origin
    },
    credentials: true, // Allow cookies
    exposedHeaders: ["Content-Range", "Accept-Ranges", "Content-Length"],
    methods: ["GET", "PUT", "POST", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limit for login endpoint
appServer.use(
  "/users/login",
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 10 attempts per IP
    message: "Too many login attempts, please try again later",
  })
);

appServer.use(express.json({ limit: "50mb" }));
appServer.use(express.urlencoded({ limit: "50mb", extended: true }));
appServer.use(
  "/media",
  express.static(FilesManager.getExternalPath("resources"))
);

// Global server and WebSocket manager
export let server: http.Server | https.Server;
export let wsManager: WebSocketManager;

// Start the app
app.whenReady().then(async () => {
  // Initialize dependencies
  await downloadYtDlp();
  await SequelizeManager.initializeDB();
  FilesManager.initFolders();
  FilesManager.loadProperties();
  await ConfigManager.loadConfig();

  // Initialize MovieDB
  await MovieDBWrapper.initConnection();

  // Load or create server and user configs
  await ServerConfigManager.loadOrCreateServerConfig();

  // Initialize routes
  addServerRoutes(appServer);

  // Serve static web files
  const webPath = path.join(__dirname, "web");
  appServer.use(express.static(webPath));

  // Capture all requests and redirect to index.html
  appServer.get(/^(?!\/api).*/, (_req: Request, res: Response) => {
    res.sendFile(path.join(webPath, "index.html"));
  });

  // Start server
  await ServerConfigManager.startServer(appServer);

  // Initialize WebSocket
  wsManager = WebSocketManager.getInstance(ServerConfigManager.mainServer);

  // Setup UPnP port mapping
  await ServerConfigManager.setupPortMapping();

  // Create tray
  createTray();
});

// Prevent default quit behavior on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
