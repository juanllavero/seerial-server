import os from "os";
import path from "path";

export const APP_NAME = "Seerial Media Server";
export const LOCAL_DATA_PATH = path.join(
  os.homedir(),
  process.platform === "win32"
    ? "AppData\\Local"
    : process.platform === "darwin"
    ? "Library/Application Support"
    : process.platform === "linux"
    ? ".config"
    : "",
  APP_NAME
);

export enum UserType {
  NORMAL = "normal",
  ADMIN = "admin",
}

export const initFolders: string[] = [
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
