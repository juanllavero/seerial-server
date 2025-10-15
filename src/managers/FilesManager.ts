import { LOCAL_DATA_PATH } from "@/utils/constants";
import {
  audioExtensions,
  imageExtensions,
  videoExtensions,
} from "@/utils/utils";
import axios from "axios";
import fs from "fs";
import multer from "multer";
import path from "path";
import PropertiesReader, { Reader } from "properties-reader";
import { SanitizationManager } from "./SanitizationManager";

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
      const destPath = req.body.destPath
        ? path.join(this.resourcesPath, req.body.destPath)
        : path.join(this.resourcesPath, "img", "DownloadCache"); // Destination path received from client or default

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
  public static upload = multer({ storage: this.storage }).fields([
    { name: "image", maxCount: 1 },
  ]);

  /**
   * Initializes the folders defined in the class property 'folders' by creating them if they don't exist.
   */
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
    return path.join(__dirname, "@/", relativePath);
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

  //#region UTILS
  public static downloadImage = async (url: string, filePath: string) => {
    try {
      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
      });

      return new Promise<void>((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);
        writer.on("finish", resolve);
        writer.on("error", reject);
      });
    } catch (error: any) {
      throw new Error(`Error downloading image: ${error.message}`);
    }
  };

  public static getFileName(filePath: string) {
    const fileNameWithExtension = filePath.split(/[/\\]/).pop() || "";
    const fileName =
      fileNameWithExtension.split(".").slice(0, -1).join(".") ||
      fileNameWithExtension;
    return fileName;
  }

  public static isFolder = async (folderPath: string): Promise<boolean> => {
    try {
      const stats = await fs.promises.stat(folderPath);
      return stats.isDirectory();
    } catch (error) {
      console.error(
        `isFolder: Error al acceder a la ruta ${folderPath}:`,
        error
      );
      return false;
    }
  };

  public static getFilesInFolder = async (folderPath: string) => {
    try {
      const stats = await fs.promises.stat(folderPath);

      if (!stats.isDirectory()) {
        return [];
      }

      return await fs.promises.readdir(folderPath, { withFileTypes: true });
    } catch (error) {
      console.error(
        `getFilesInFolder: Error al acceder a la ruta ${folderPath}:`,
        error
      );
      return [];
    }
  };

  public static getValidVideoFiles = async (folderPath: string) => {
    const videoFiles: string[] = [];

    try {
      const sanitizedPath = SanitizationManager.sanitizeDirectoryPath(
        folderPath,
        SanitizationManager.getSystemAllowedPaths(),
        true
      );

      const filesAndFolders = await this.getFilesInFolder(sanitizedPath);

      for (const fileOrFolder of filesAndFolders) {
        const fullPath = path.join(sanitizedPath, fileOrFolder.name);

        if (fileOrFolder.isFile() && this.isVideoFile(fullPath)) {
          videoFiles.push(fullPath);
        } else if (fileOrFolder.isDirectory()) {
          const subFiles = await fs.promises.readdir(fullPath);
          for (const subFile of subFiles) {
            const subFilePath = path.join(fullPath, subFile);
            if (
              fs.lstatSync(subFilePath).isFile() &&
              this.isVideoFile(subFilePath)
            ) {
              videoFiles.push(subFilePath);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error getting video files:", error);
    }

    return videoFiles;
  };

  public static isVideoFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return videoExtensions.includes(ext);
  }

  public static isAudioFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return audioExtensions.includes(ext);
  }

  public static fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  public static createJSONFileIfNotExists(filePath: string, content: any) {
    if (!this.fileExists(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(content));
    }
  }

  public static getMusicFiles = async (
    folderPath: string
  ): Promise<string[]> => {
    const musicFiles: string[] = [];
    const searchDepth: number = 4;

    // Recursive function to explore subfolders
    const exploreDirectory = async (
      currentPath: string,
      currentDepth: number
    ): Promise<void> => {
      const entries = await this.getFilesInFolder(currentPath);

      for (const entry of entries) {
        const entryPath = path.join(currentPath, entry.name);

        if (entry.isFile() && this.isAudioFile(entryPath)) {
          musicFiles.push(entryPath);
        } else if (
          entry.isDirectory() &&
          currentDepth < searchDepth &&
          !entry.name.startsWith("[")
        ) {
          await exploreDirectory(entryPath, currentDepth + 1);
        }
      }
    };

    await exploreDirectory(folderPath, 0);

    return musicFiles;
  };

  /**
   * Function to search for an image in a folder
   * @param folderPath string that represents the folder path
   * @returns string representing the image path if found or null if not
   */
  public static findImageInFolder = async (
    folderPath: string
  ): Promise<string | null> => {
    const files = await fs.promises.readdir(folderPath);

    for (const file of files) {
      const fileExt = path.extname(file).toLowerCase();
      if (
        imageExtensions.includes(fileExt) &&
        file.toLowerCase().includes("cover")
      ) {
        return path.join(folderPath, file);
      }
    }

    return null;
  };

  public static getFileInFolder = (folder: string, fileName: string) => {
    try {
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
      }

      const files = fs.readdirSync(folder);

      const matchedFile = files.find((file) => {
        const fileNameWithoutExt = path.parse(file).name;
        return fileNameWithoutExt === fileName;
      });

      if (!matchedFile) {
        return "";
      }

      return path.join(folder, matchedFile);
    } catch (err) {
      return "";
    }
  };

  /**
   * Checks if a string is a valid URL
   * @param urlString string representing the URL
   * @returns
   */
  public static isValidURL = (urlString: string) => {
    try {
      const url = new URL(urlString);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch (err) {
      return false;
    }
  };
  //#endregion
}
