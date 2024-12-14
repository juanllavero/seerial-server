import { nativeImage, app, Tray, Menu } from "electron";
import path from "path";
import express from "express";
import open from "open"; // Para abrir el navegador en localhost:3000
import http from "http";
import { DataManager } from "../../src/data/utils/DataManager";

const isDev = process.env.NODE_ENV === 'development';

// Obtener el directorio del archivo actual con import.meta.url
const __dirname = path.dirname(new URL(import.meta.url).pathname);

const appServer = express();
const PORT = 3000;

//#region GET DATA

// Ruta para servir las imágenes
const imgPath = isDev
	? path.join(app.getAppPath(), "resources", "img") // En desarrollo
	: path.join(process.resourcesPath, "resources", "img"); // En producción

console.log(imgPath);
appServer.use("/img", express.static(imgPath));

// Configurar el servidor de streaming
appServer.get(
	"/video",
	(_req: any, res: { sendFile: (arg0: string) => void }) => {
		const videoPath = path.resolve(__dirname, "video.mp4"); // Ruta del video
		res.sendFile(videoPath); // Sirve el archivo de video
	}
);

// Configurar página principal
appServer.get("/libraries", (_req, res) => {
	const data = DataManager.loadData();
	res.json(data);
});

/*appServer.get("image/background/default/:id", (req, res) => {
  const id = req.params.id;
  const image = DataManager.getImage(`resources/img/backgrounds/${id}/background.jpg`);
  if (image) {
    res.send(image);
  } else {
    res.status(404).send("Image not found");
  }
});

appServer.get("image/background/blur/:id", (req, res) => {
  const id = req.params.id;
  const image = DataManager.getBackground(id);
  if (image) {
    res.send(image);
  } else {
    res.status(404).send("Image not found");
  }
});

appServer.get("image/poster/:id", (req, res) => {
  const id = req.params.id;
  const image = DataManager.getPoster(id);
  if (image) {
    res.send(image);
  } else {
    res.status(404).send("Image not found");
  }
});

appServer.get("image/logo/:id", (req, res) => {
  const id = req.params.id;
  const image = DataManager.getLogo(id);
  if (image) {
    res.send(image);
  } else {
    res.status(404).send("Image not found");
  }
});

appServer.get("image/thumbnail/video/:id", (req, res) => {
  const id = req.params.id;
  const image = DataManager.getVideoThumbnail(id);
  if (image) {
    res.send(image);
  } else {
    res.status(404).send("Image not found");
  }
});

appServer.get("image/thumbnail/chapters/:id", (req, res) => {
  const id = req.params.id;
  const image = DataManager.getChapterThumbnail(id);
  if (image) {
    res.send(image);
  } else {
    res.status(404).send("Image not found");
  }
});*/

//#endregion

// Crear servidor HTTP
const server = http.createServer(appServer);

// Iniciar servidor
server.listen(PORT, () => {
	console.log(`Servidor de streaming corriendo en http://localhost:${PORT}`);
});

let tray: Tray;

// Crear el tray y configurar el menú
app.whenReady().then(() => {
	const iconPath = path.join(__dirname, "public", "icon.png");
	const image = nativeImage.createFromPath(iconPath);
	tray = new Tray(image);

	const contextMenu = Menu.buildFromTemplate([
		{
			label: "Open Media Server",
			click: () => {
				// Abre localhost:3000 en el navegador predeterminado
				open("http://localhost:3000");
			},
		},
		{
			label: "Exit",
			click: () => app.quit(),
		},
	]);

	tray.setContextMenu(contextMenu);
});

// Cerrar la aplicación cuando se cierran todas las ventanas (en sistemas como Windows)
app.on("window-all-closed", () => {
	if (process.platform !== "darwin") {
		app.quit();
	}
});
