import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { SanitizationManager } from "@/managers/SanitizationManager";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs";
import os from "os";
import path from "path";

const router = express.Router();

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
router.get(
  "/drives",
  catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const drives = getDrives();
    return res.status(200).json(drives);
  })
);

// Function to get files and folders within a directory
const getFolderContent = (dirPath: string) => {
  const contents: { name: string; isFolder: boolean }[] = [];

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
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
router.get(
  "/folder",
  catchAsync(async (req, res, next) => {
    const folderPath = req.query.path;

    if (!folderPath || folderPath === "") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    try {
      const sanitizedPath = SanitizationManager.sanitizeDirectoryPath(
        folderPath as string,
        SanitizationManager.getSystemAllowedPaths(),
        true // Must exist
      );

      const content = getFolderContent(sanitizedPath);
      res.status(200).json(content);
    } catch (error: any) {
      return next(new ApiError(400, `Invalid folder path: ${error.message}`));
    }
  })
);

export default router;
