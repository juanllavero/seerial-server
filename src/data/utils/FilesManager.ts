import { app } from "electron";
import path from "path";
import fs from "fs";
import { DataManager } from "./DataManager";
import { Utils } from "./Utils";
import multer from "multer";
import PropertiesReader, { Reader } from "properties-reader";

export class FilesManager {
  public static extPath = app.isPackaged
    ? path.dirname(app.getPath("exe"))
    : app.getAppPath();
  public static resourcesPath = path.join(this.extPath, "resources");
  public static propertiesFilePath = path.join(
    this.extPath,
    "resources",
    "config",
    "keys.properties"
  );

  public static properties: Reader | undefined = undefined;

  // Multer configuration to store files on disk
  public static storage = multer.diskStorage({
    destination: (req, _file, cb) => {
      console.log({
        storagePath: req.body.destPath,
      });
      const destPath =
        path.join(this.resourcesPath, req.body.destPath) ||
        path.join(this.resourcesPath, "img", "DownloadCache"); // Destination path received from client or default

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
    Utils.createFolder(path.join(this.extPath, "resources"));
    Utils.createFolder(path.join(this.extPath, "resources/config"));

    if (!fs.existsSync(this.propertiesFilePath)) {
      fs.writeFileSync(this.propertiesFilePath, "");
    }

    DataManager.initFolders();

    // Create config.json if it doesn't exist
    if (
      !fs.existsSync(
        path.join(this.extPath, "resources", "config", "config.json")
      )
    ) {
      fs.writeFileSync(
        path.join(this.extPath, "resources", "config", "config.json"),
        JSON.stringify({ language: "es-ES" }, null, 2),
        "utf-8"
      );
    }
  }

  public static loadProperties() {
    // Create keys.properties if it doesn't exist
    if (
      !fs.existsSync(
        path.join(this.extPath, "resources", "config", "keys.properties")
      )
    ) {
      fs.writeFileSync(
        path.join(this.extPath, "resources", "config", "keys.properties"),
        JSON.stringify({ language: "es-ES" }, null, 2),
        "utf-8"
      );
    }

    this.properties = PropertiesReader(this.propertiesFilePath);
  }
}
