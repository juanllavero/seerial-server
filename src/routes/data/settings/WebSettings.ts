import express from "express";
import fs from "fs";
import { FilesManager } from "../../../utils/FilesManager";
import { Utils } from "../../../utils/Utils";

const router = express.Router();

const WEB_CONFIG_FILE = FilesManager.getExternalPath(
  "resources/config/webConfig.json"
);

const defaultWebConfig = {
  playBackgroundMusic: true,
  backgroundMusicVolume: 30,
  timeFormat: "24h",
  localVideoQuality: "original",
  onlineVideoQuality: "original",
  showPosters: true,
  subtitleColor: "white",
  subtitlePosition: "bottom",
  subtitleSize: "small",
  burntSubtitles: "auto",
  cardSize: "big",
};

// GET /config/:key - Retrieves a specific setting
router.get("/webConfig/:key", (req: any, res: any) => {
  const key = req.params.key;

  Utils.createJSONFileIfNotExists(WEB_CONFIG_FILE, defaultWebConfig);
  const configData = JSON.parse(fs.readFileSync(WEB_CONFIG_FILE, "utf8"));

  // If the key does not exist, return null
  const value = configData[key] !== undefined ? configData[key] : null;
  res.json({ key, value });
});

// GET /config - Returns all settings
router.get("/webConfig", (_req: any, res: any) => {
  Utils.createJSONFileIfNotExists(WEB_CONFIG_FILE, defaultWebConfig);
  const configData = JSON.parse(fs.readFileSync(WEB_CONFIG_FILE, "utf8"));
  res.json(configData);
});

// PATCH /config - Modifies the data and saves the settings
router.patch("/webConfig", (req: any, res: any) => {
  Utils.createJSONFileIfNotExists(WEB_CONFIG_FILE, defaultWebConfig);
  const updates = req.body; // The data to be modified is sent in the body of the request
  let configData = JSON.parse(fs.readFileSync(WEB_CONFIG_FILE, "utf8"));

  // Update the existing data with the new values
  configData = { ...configData, ...updates };

  // Save the updated data to the file
  fs.writeFileSync(WEB_CONFIG_FILE, JSON.stringify(configData, null, 2));
  res.json({ message: "Configuration updated", config: configData });
});

export default router;
