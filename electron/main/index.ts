import { nativeImage, app, Tray, Menu } from "electron";
import fs from "fs";
import path from "path";
import express from "express";
import open, { apps } from "open"; // Open in browser
import http from "http";
import { DataManager } from "../../src/data/utils/DataManager";
import propertiesReader from "properties-reader";
import { MovieDb } from "moviedb-promise";

// Check if running in development
const isDev = process.env.NODE_ENV === "development";

// Get current directory path
const __dirname = path.dirname(new URL(import.meta.url).pathname);

// Get resources folder path
const resourcesPath = isDev
	? path.join(app.getAppPath(), "resources") // Development
	: path.join(process.resourcesPath, "resources"); // Production

const propertiesFilePath = path.join(
	resourcesPath,
	"config",
	"keys.properties"
);

if (!fs.existsSync(propertiesFilePath)) {
	fs.writeFileSync(propertiesFilePath, "");
}

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

// Configure streaming server
appServer.get(
	"/video",
	(_req: any, res: { sendFile: (arg0: string) => void }) => {
		const videoPath = path.resolve(__dirname, "video.mp4");
		res.sendFile(videoPath); // Send video file
	}
);

// Get libraries
appServer.get("/libraries", (_req, res) => {
	const data = DataManager.loadData();
	res.json(data);
});

//#endregion

//#region UPDATE DATA

// Update Library
appServer.put("/libraries/:libraryId", (req, res) => {
	const { libraryId } = req.params;
	const updatedLibrary = req.body; // Datos que vienen del cliente

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
//#endregion

//#region CREATE HTTP SERVER
const server = http.createServer(appServer);

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
			label: "Open Media Server",
			click: () => {
				// Open in browser
				open("http://localhost:3000");
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
