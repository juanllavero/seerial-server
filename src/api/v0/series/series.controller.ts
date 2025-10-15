import { getLibraryById } from "@/api/v0/libraries/libraries.service";
import fs from "fs-extra";
import path from "path";
import { SeriesData } from "./series.types";

// Delete show stored data
export async function deleteSeriesData(libraryId: string, series: SeriesData) {
  try {
    await fs.remove(path.join("resources", "img", "posters", series.id ?? ""));
    await fs.remove(path.join("resources", "img", "logos", series.id ?? ""));
  } catch (error) {
    console.error(
      "deleteSeriesData: Error deleting cover images directory",
      error
    );
  }

  const library = await getLibraryById(libraryId);

  await library?.removeAnalyzedFolder(series.folder);
}
