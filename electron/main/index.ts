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