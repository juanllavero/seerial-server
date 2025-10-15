import fs from "fs-extra";
import path from "path";
import { SeasonData } from "./seasons.types";

// Delete season stored data
export async function deleteSeasonData(season: SeasonData) {
  try {
    await fs.remove(
      path.join("resources", "img", "backgrounds", season.id ?? "")
    );
    await fs.remove(path.join("resources", "img", "logos", season.id ?? ""));
    await fs.remove(path.join("resources", "img", "posters", season.id ?? ""));

    if (season.musicSrc) {
      await fs.remove(season.musicSrc);
    }
    if (season.videoSrc) {
      await fs.remove(season.videoSrc);
    }
  } catch (error) {
    console.error(
      "deleteSeasonData: Error deleting images files and directories",
      error
    );
  }
}
