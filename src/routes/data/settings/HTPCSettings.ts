import express from "express";
import fs from "fs";
import { FilesManager } from "../../../utils/FilesManager";
import { Utils } from "../../../utils/Utils";

const router = express.Router();

const HTPC_CONFIG_FILE = FilesManager.getExternalPath(
  "resources/config/htpcConfig.json"
);

const defaultHTPCConfig = {
  backgroundChoice: true,
  backgroundDelay: 2.0,
  backgroundVideoZoom: "Normal",
  backgroundVolume: 30,
  cardSize: 2,
  currentLanguageTag: "es-ES",
  interpolation: false,
  showClock: true,
  subtitleSize: 0.8,
};

// GET /config/:key - Retrieves a specific setting
router.get("/htpcConfig/:key", (req: any, res: any) => {
  const key = req.params.key;

  Utils.createJSONFileIfNotExists(HTPC_CONFIG_FILE, defaultHTPCConfig);
  const configData = JSON.parse(fs.readFileSync(HTPC_CONFIG_FILE, "utf8"));

  // If the key does not exist, return null
  const value = configData[key] !== undefined ? configData[key] : null;
  res.json({ key, value });
});

// GET /config - Returns all settings
router.get("/htpcConfig", (_req: any, res: any) => {
  Utils.createJSONFileIfNotExists(HTPC_CONFIG_FILE, defaultHTPCConfig);
  const configData = JSON.parse(fs.readFileSync(HTPC_CONFIG_FILE, "utf8"));
  res.json(configData);
});

// PATCH /config - Modifies the data and saves the settings
router.patch("/htpcConfig", (req: any, res: any) => {
  Utils.createJSONFileIfNotExists(HTPC_CONFIG_FILE, defaultHTPCConfig);
  const updates = req.body; // The data to be modified is sent in the body of the request
  let configData = JSON.parse(fs.readFileSync(HTPC_CONFIG_FILE, "utf8"));

  // Update the existing data with the new values
  configData = { ...configData, ...updates };

  // Save the updated data to the file
  fs.writeFileSync(HTPC_CONFIG_FILE, JSON.stringify(configData, null, 2));
  res.json({ message: "Configuration updated", config: configData });
});

export default router;
