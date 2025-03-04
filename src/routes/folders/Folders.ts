import express from "express";
const router = express.Router();
import fs from "fs";
import os from "os";
import path from "path";

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
router.get("/drives", (req, res) => {
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
router.get("/folder/*", (req: any, res: any) => {
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

export default router;
