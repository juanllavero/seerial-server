import { Utils } from "@/data/utils/Utils";
import { app } from "electron";
import express from "express";
import fs from "fs";
import path from "path";
const router = express.Router();

const extPath = app.isPackaged
  ? path.dirname(app.getPath("exe"))
  : app.getAppPath();

const CONFIG_FILE = path.join(extPath, "resources", "config", "webConfig.json");

const defaultConfig = {
  backgroundVolume: 30,
  cardSize: 2,
  currentLanguageTag: "es-ES",
  playMusicDesktop: false,
  subtitleSize: 0.8,
};

// GET /config/:key - Retrieves a specific setting
router.get("/webConfig/:key", (req: any, res: any) => {
  const key = req.params.key;

  Utils.createJSONFileIfNotExists(CONFIG_FILE, defaultConfig);
  const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));

  // If the key does not exist, return null
  const value = configData[key] !== undefined ? configData[key] : null;
  res.json({ key, value });
});

// GET /config - Returns all settings
router.get("/webConfig", (_req: any, res: any) => {
  Utils.createJSONFileIfNotExists(CONFIG_FILE, defaultConfig);
  const configData = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
  res.json(configData);
});

// PATCH /config - Modifies the data and saves the settings
router.patch("/webConfig", (req: any, res: any) => {
  Utils.createJSONFileIfNotExists(CONFIG_FILE, defaultConfig);
  const updates = req.body; // The data to be modified is sent in the body of the request
  let configData = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));

  // Update the existing data with the new values
  configData = { ...configData, ...updates };

  // Save the updated data to the file
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(configData, null, 2));
  res.json({ message: "Configuration updated", config: configData });
});

export default router;
