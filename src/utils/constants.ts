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
