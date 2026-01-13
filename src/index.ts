import {
  fileSystemService,
  notificationService,
  tmdbApiClient,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import appRoutes from "@/initialization/AddRoutes";
import { createTray } from "@/initialization/CreateTray";
import * as ConfigManager from "@/managers/ConfigManager";
import { SequelizeManager } from "@/managers/SequelizeManager";
import { ServerConfigManager } from "@/managers/ServerConfigManager";
import { downloadYtDlp } from "@/utils/youtubeDownloader";
import cors from "cors";
import { config } from "dotenv";
import { app } from "electron";
import express, {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import http from "http";
import https from "https";
import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { sanitizationMiddleware } from "./middleware/sanitization.middleware";

// Initialize app and environment
config();
process.env.APP_ROOT = path.join(__dirname, "../../");
export const appServer = express();

// Sanitization middleware
appServer.use(sanitizationMiddleware);

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
appServer.use(
  "/media",
  express.static(fileSystemService.getExternalPath("resources"))
);

// Global server and WebSocket manager
export let server: http.Server | https.Server;

// Start the app
app.whenReady().then(async () => {
  // Initialize dependencies
  await downloadYtDlp();
  await SequelizeManager.initializeDB();
  fileSystemService.initFolders();
  fileSystemService.loadProperties();
  await ConfigManager.loadConfig();

  // Initialize MovieDB
  await tmdbApiClient.initialize();

  // Load or create server and user configs
  await ServerConfigManager.loadOrCreateServerConfig();

  // Swagger configuration
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Seerial Media Server API",
        version: "0.2.0",
        description: "Media management server API for the Seerial suite",
        contact: {
          name: "Juan Llavero",
        },
      },
      servers: [
        {
          url: "http://localhost:8080/api",
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "token",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
        {
          cookieAuth: [],
        },
      ],
    },
    apis: ["./src/api/**/*.ts"], // Path to the API docs - adjusted path
  };

  const swaggerSpec = swaggerJSDoc(swaggerOptions);

  // Swagger UI
  appServer.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Initialize routes
  appServer.use("/api", appRoutes);

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

  // Error handler
  const errorHandler: ErrorRequestHandler = (
    err: any,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    console.error(err.stack); // Logging
    res.status(err.status || 500).json({
      status: "error",
      message: err.message || "Something went wrong",
    });
  };
  appServer.use(errorHandler);

  // Start server
  await ServerConfigManager.startServer(appServer);

  // Initialize NotificationService through DI container
  notificationService.init(ServerConfigManager.mainServer);

  // Setup UPnP port mapping
  await ServerConfigManager.setupPortMapping();

  // Create tray
  createTray();
});

// Prevent default quit behavior on macOS
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
