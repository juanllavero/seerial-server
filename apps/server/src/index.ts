import type http from "node:http";
import type https from "node:https";
import path from "node:path";
import {
	appReadyMessage,
	showAppName,
	showMessage,
	spinner,
} from "@seerial/cli";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "dotenv";
import { app } from "electron";
import type { Express, NextFunction, Request, Response } from "express";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import {
	downloaderService,
	fileSystemService,
	notificationService,
	tmdbApiClient,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import * as ConfigManager from "@/api/v1/shared/infrastructure/services/ConfigService";
import swaggerDocument from "../swagger.json";
import { ServerConfigService } from "./api/v1/servers/infrastructure/services/ServerConfigService";
import { DatabaseManager } from "./api/v1/shared/infrastructure/persistence/DatabaseManager";
import { globalErrorHandler } from "./api/v1/shared/infrastructure/web/exceptions/GlobalErrorHandler";
import { requestsIDsMiddleware } from "./middleware/request.id.middleware";
import { sanitizationMiddleware } from "./middleware/sanitization.middleware";
import { RegisterRoutes } from "./routes/routes";
import { createTray } from "./utils/appTray";

// Initialize app and environment
config({
	quiet: true,
});
process.env.APP_ROOT = path.join(__dirname, "../../");
export const appServer: Express = express();

// Add compression middleware to compress responses and save bandwidth
appServer.use(compression());

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
		methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	}),
);

// Rate limit for login endpoint
appServer.use(
	"/users/login",
	rateLimit({
		windowMs: 10 * 60 * 1000, // 10 minutes
		max: 20, // 20 attempts per IP
		message: "Too many login attempts, please try again later",
	}),
);

// Limit the max number of requests per minute
appServer.use(
	rateLimit({
		windowMs: 1 * 60 * 1000, // 1 minute
		max: 1000, // max 1000 requests per minute
		standardHeaders: true,
		legacyHeaders: false,
	}),
);

// Configure helmet middleware to avoid some security vulnerabilities
appServer.use(
	helmet({
		contentSecurityPolicy: {
			// Applied only to HTML responses (the embedded web client).
			// The API itself returns JSON, so CSP has minimal impact there,
			// but the web frontend benefits from script/style restrictions.
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'"],
				styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles required by some UI libs
				imgSrc: ["'self'", "data:", "blob:"],
				mediaSrc: ["'self'", "blob:"],
				connectSrc: ["'self'", "ws:", "wss:"],
				fontSrc: ["'self'", "data:"],
				objectSrc: ["'none'"],
				frameAncestors: ["'self'"],
			},
		},
		crossOriginEmbedderPolicy: false, // Avoid problems with video streaming
	}),
);

appServer.use(express.json({ limit: "50mb" }));
appServer.use(express.urlencoded({ limit: "50mb", extended: true }));
appServer.use(cookieParser());
appServer.use(
	"/media",
	express.static(fileSystemService.getExternalPath("resources")),
);

// Global server and WebSocket manager
export let server: http.Server | https.Server;

// Start the app
app.whenReady().then(async () => {
	showAppName("SEERIAL SERVER");

	// Dynamic CLI message
	const s = spinner();

	// Initialize dependencies
	s.start("Initializing Youtube Downloader...");

	await downloaderService.downloadYoutubeDownloader();

	s.stop("Youtube Downloader Initialized");

	await DatabaseManager.initializeDB();
	fileSystemService.initFolders();
	fileSystemService.loadProperties();
	await ConfigManager.loadConfig();

	showMessage("Database Initialized");

	// Initialize MovieDB
	await tmdbApiClient.initialize();

	showMessage("TheMovieDB API Client Initialized");

	// Load or create server and user configs
	await ServerConfigService.loadOrCreateServerConfig();

	// Swagger UI — only exposed outside production to prevent API enumeration
	if (process.env.NODE_ENV !== "production") {
		appServer.use(
			"/api-docs",
			swaggerUi.serve,
			swaggerUi.setup(swaggerDocument),
		);
	}

	// Register generated tsoa routes
	RegisterRoutes(appServer);

	// Serve static web files
	const webPath = path.join(__dirname, "web");
	appServer.use(express.static(webPath));

	// Capture all requests and redirect to index.html
	appServer.use((req: Request, res: Response, next: NextFunction) => {
		// If the request is for a file (has an extension), skip to next middleware
		if (path.extname(req.path)) {
			return next();
		}

		res.sendFile(path.join(webPath, "index.html"));
	});

	// Error handling middleware
	appServer.use(globalErrorHandler);

	// Start server
	await ServerConfigService.startServer(appServer);

	showMessage("Server Initialized");

	// Initialize NotificationService through DI container
	notificationService.init(ServerConfigService.mainServer);

	// Create tray
	createTray();

	const httpPort = ServerConfigService.serverConfig.httpPort;
	appReadyMessage({
		url: `http://localhost:${httpPort}/api/v1`,
		swaggerUrl: `http://localhost:${httpPort}/api-docs`,
		env: "development",
	});
});

// Prevent default quit behavior on macOS
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
