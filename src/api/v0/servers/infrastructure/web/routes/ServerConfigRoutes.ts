import { fileSystemService } from "@/api/v0/shared/infrastructure/adapters/di/container";
import express, { Request, Response } from "express";

const router = express.Router();

const getServerConfigFile = (): string => {
  return fileSystemService.getExternalPath(
    "resources/config/serverConfig.json"
  );
};

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
router.get("/serverConfig/:key", (req: Request, res: Response) => {
  const key = req.params.key;

  const SERVER_CONFIG_FILE = getServerConfigFile();

  fileSystemService.createJSONFile(SERVER_CONFIG_FILE, defaultServerConfig);
  const configData = JSON.parse(
    fileSystemService.readFileSync(SERVER_CONFIG_FILE, "utf8")
  );

  // If the key does not exist, return null
  const value = configData[key] !== undefined ? configData[key] : null;
  res.json({ key, value });
});

// GET /config - Returns all settings
router.get("/serverConfig", (_req: Request, res: Response) => {
  const SERVER_CONFIG_FILE = getServerConfigFile();

  fileSystemService.createJSONFile(SERVER_CONFIG_FILE, defaultServerConfig);
  const configData = JSON.parse(
    fileSystemService.readFileSync(SERVER_CONFIG_FILE, "utf8")
  );
  res.json(configData);
});

// PATCH /config - Modifies the data and saves the settings
router.patch("/serverConfig", (req: Request, res: Response) => {
  const SERVER_CONFIG_FILE = getServerConfigFile();

  fileSystemService.createJSONFile(SERVER_CONFIG_FILE, defaultServerConfig);
  const updates = req.body; // The data to be modified is sent in the body of the request
  let configData = JSON.parse(
    fileSystemService.readFileSync(SERVER_CONFIG_FILE, "utf8")
  );

  // Update the existing data with the new values
  configData = { ...configData, ...updates };

  // Save the updated data to the file
  fileSystemService.writeFile(
    SERVER_CONFIG_FILE,
    JSON.stringify(configData, null, 2)
  );
  res.json({ message: "Configuration updated", config: configData });
});

export default router;
