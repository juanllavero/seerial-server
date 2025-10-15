import { getLibraryById } from "@/api/v0/libraries/libraries.service";
import fs from "fs-extra";
import path from "path";
import { MovieData } from "./movies.types";

export async function deleteMovieData(libraryId: string, movie: MovieData) {
  try {
    await fs.remove(
      path.join("resources", "img", "backgrounds", movie.id ?? "")
    );
    await fs.remove(path.join("resources", "img", "posters", movie.id ?? ""));
    await fs.remove(path.join("resources", "img", "logos", movie.id ?? ""));
  } catch (error) {
    console.error(
      "deleteSeriesData: Error deleting cover images directory",
      error
    );
  }

  const library = await getLibraryById(libraryId);

  await library?.removeAnalyzedFolder(movie.folder);
}
