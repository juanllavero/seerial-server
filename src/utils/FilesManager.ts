import fs from "fs";
import multer from "multer";
import path from "path";
import PropertiesReader, { Reader } from "properties-reader";
import { LOCAL_DATA_PATH } from "./constants";

export class FilesManager {
  public static extPath = "/";
  public static resourcesPath = this.getExternalPath("resources");
  public static propertiesFilePath = this.getExternalPath(
    "resources/config/keys.properties"
  );

  public static properties: Reader | undefined = undefined;

  static folders: string[] = [
    "resources/",
    "resources/config",
    "resources/img/",
    "resources/img/posters/",
    "resources/img/logos/",
    "resources/img/backgrounds/",
    "resources/img/thumbnails/",
    "resources/img/thumbnails/video/",
    "resources/img/thumbnails/chapters/",
    "resources/img/DownloadCache/",
  ];

  // Multer configuration to store files on disk
  public static storage = multer.diskStorage({
    destination: (req, _file, cb) => {
      console.log({
        storagePath: req.body.destPath,
      });
      const destPath = this.getExternalPath(
        req.body.destPath
          ? path.join(this.resourcesPath, req.body.destPath)
          : path.join(this.resourcesPath, "img", "DownloadCache")
      ); // Destination path received from client or default

      // Create folder if it doesn't exist
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      cb(null, destPath);
    },
    filename: (_req, file, cb) => {
      cb(null, file.originalname);
    },
  });

  // Function to upload files from client
  public static upload = multer({ storage: this.storage });

  public static initFolders() {
    // Initialize folders
    for (const folderPath of this.folders) {
      this.createFolder(this.getExternalPath(folderPath));
    }
  }

  public static loadProperties() {
    // Create keys.properties if it doesn't exist
    if (!fs.existsSync(FilesManager.propertiesFilePath)) {
      fs.writeFileSync(FilesManager.propertiesFilePath, "");
    }

    this.properties = PropertiesReader(FilesManager.propertiesFilePath);
  }

  /**
   * Returns the absolute path for an external file relative to the executable (production)
   * or the project root (development). Creates parent directories if they don't exist.
   * @param relativePath - Relative path (e.g., 'resources/db/data.db', 'resources/config/config.json')
   * @returns Absolute path to the external file
   */
  public static getExternalPath(relativePath: string): string {
    try {
      const baseDir = LOCAL_DATA_PATH;
      const fullPath = path.join(baseDir, relativePath);

      const isNumeric = !isNaN(Number(relativePath));

      if (!isNumeric) {
        const parentDir = path.dirname(fullPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
      }

      return fullPath;
    } catch (error) {
      return "";
    }
  }

  /**
   * Returns the absolute path for an internal file within src.
   * @param relativePath - Relative path within src (e.g., 'db/schema.ts')
   * @returns Absolute path to the internal file
   */
  public static getInternalPath(relativePath: string): string {
    return path.join(__dirname, "../", relativePath);
  }

  /**
   * Creates a folder recursively given a specific path
   * @param path absolute path to create
   */
  public static createFolder(path: string) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }
}
