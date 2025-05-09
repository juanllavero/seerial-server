import express from "express";
import fs from "fs";
import { FilesManager } from "../../../utils/FilesManager";
import { Utils } from "../../../utils/Utils";

const router = express.Router();

const SERVER_CONFIG_FILE = FilesManager.getExternalPath(
  "resources/config/serverConfig.json"
);

const defaultServerConfig = {
  autoScan: false,
  autoScanPeriod: "never",
  generateChapters: "never",
  autoSelectTracks: true,
  preferAudioLan: "es-ES",
  preferSubsLan: "es-ES",
  subsMode: "autoSubs",
  tempTranscodeFolder: "",
  transcodeBuffer: 60,
  transcodePreset: "veryfast",
  maxTranscodeProcesses: 4,
  automaticUpdates: false,
};

// GET /config/:key - Retrieves a specific setting
router.get("/serverConfig/:key", (req: any, res: any) => {
  const key = req.params.key;

  Utils.createJSONFileIfNotExists(SERVER_CONFIG_FILE, defaultServerConfig);
  const configData = JSON.parse(fs.readFileSync(SERVER_CONFIG_FILE, "utf8"));

  // If the key does not exist, return null
  const value = configData[key] !== undefined ? configData[key] : null;
  res.json({ key, value });
});

// GET /config - Returns all settings
router.get("/serverConfig", (_req: any, res: any) => {
  Utils.createJSONFileIfNotExists(SERVER_CONFIG_FILE, defaultServerConfig);
  const configData = JSON.parse(fs.readFileSync(SERVER_CONFIG_FILE, "utf8"));
  res.json(configData);
});

// PATCH /config - Modifies the data and saves the settings
router.patch("/serverConfig", (req: any, res: any) => {
  Utils.createJSONFileIfNotExists(SERVER_CONFIG_FILE, defaultServerConfig);
  const updates = req.body; // The data to be modified is sent in the body of the request
  let configData = JSON.parse(fs.readFileSync(SERVER_CONFIG_FILE, "utf8"));

  // Update the existing data with the new values
  configData = { ...configData, ...updates };

  // Save the updated data to the file
  fs.writeFileSync(SERVER_CONFIG_FILE, JSON.stringify(configData, null, 2));
  res.json({ message: "Configuration updated", config: configData });
});

export default router;
