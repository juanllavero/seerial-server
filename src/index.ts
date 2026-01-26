import {
  downloaderService,
  fileSystemService,
  notificationService,
  tmdbApiClient,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { SequelizeManager } from "@/api/v1/shared/infrastructure/persistence/SequelizeManager";
import * as ConfigManager from "@/api/v1/shared/infrastructure/services/ConfigService";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import { app } from "electron";
import express, { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import http from "http";
import https from "https";
import path from "path";
import swaggerUi from "swagger-ui-express";
import swaggerDocument from "../swagger.json";
import { ServerConfigService } from "./api/v1/servers/infrastructure/services/ServerConfigService";
import { errorHandlerMiddleware } from "./middleware/errorHandler.middleware";
import { requestsIDsMiddleware } from "./middleware/requestID.middleware";
import { sanitizationMiddleware } from "./middleware/sanitization.middleware";
import { RegisterRoutes } from "./routes/routes";
import { createTray } from "./utils/appTray";

// Initialize app and environment
config({
  quiet: true,
});
process.env.APP_ROOT = path.join(__dirname, "../../");
export const appServer = express();

// Sanitization middleware
appServer.use(sanitizationMiddleware);

// Requests IDs for debugging
appServer.use(requestsIDsMiddleware);

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

// Limit the max number of requests per minute
appServer.use(
  rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // max 1000 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Configure helmet middleware to avoid some security vulnerabilities
appServer.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP
    crossOriginEmbedderPolicy: false, // Avoid problems with video streaming
  })
);

appServer.use(express.json({ limit: "50mb" }));
appServer.use(express.urlencoded({ limit: "50mb", extended: true }));
appServer.use(cookieParser());
appServer.use(
  "/media",
  express.static(fileSystemService.getExternalPath("resources"))
);

// Global server and WebSocket manager
export let server: http.Server | https.Server;

// Start the app
app.whenReady().then(async () => {
  // Initialize dependencies
  await downloaderService.downloadYoutubeDownloader();
  await SequelizeManager.initializeDB();
  fileSystemService.initFolders();
  fileSystemService.loadProperties();
  await ConfigManager.loadConfig();

  // Initialize MovieDB
  await tmdbApiClient.initialize();

  // Load or create server and user configs
  await ServerConfigService.loadOrCreateServerConfig();

  // Swagger UI
  appServer.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  // Register generated tsoa routes
  RegisterRoutes(appServer);

  // Serve static web files
  const webPath = path.join(__dirname, "web");
  appServer.use(express.static(webPath));

  // Capture all requests and redirect to index.html
  appServer.use((req: Request, res: Response, next) => {
    // If the request is for a file (has an extension), skip to next middleware
    if (path.extname(req.path)) {
      return next();
    }

    res.sendFile(path.join(webPath, "index.html"));
  });

  // Error handling middleware
  appServer.use(errorHandlerMiddleware);

  // Start server
  await ServerConfigService.startServer(appServer);

  // Initialize NotificationService through DI container
  notificationService.init(ServerConfigService.mainServer);

  // Setup UPnP port mapping
  await ServerConfigService.setupPortMapping();

  // Create tray
  createTray();
});

// Prevent default quit behavior on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
