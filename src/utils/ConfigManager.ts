import { app } from "electron";
import fs from "fs/promises";
import path from "path";

interface IConfig {
  port: number;
}

const DEFAULT_PORT = 34200;
const configPath = path.join(app.getPath("userData"), "config.json");

let config: IConfig;

/**
 * Load the config from config.json
 * If the file doesn't exist, create it with the default config
 */
export async function loadConfig(): Promise<void> {
  try {
    const data = await fs.readFile(configPath, "utf-8");
    config = JSON.parse(data);
  } catch (error) {
    config = { port: DEFAULT_PORT };
    await saveConfig();
  }
}

/**
 * Save the config to config.json
 */
export async function saveConfig(): Promise<void> {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Get the port from the config
 * @returns {number} port
 */
export function getPort(): number {
  return config.port || DEFAULT_PORT;
}

/**
 * Saves the new port to the config
 * @param {number} newPort new port
 */
export function setPort(newPort: number): void {
  config.port = newPort;
}
