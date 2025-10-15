import fs from "fs-extra";
import path from "path";
import { Album } from "./albums.model";

// Delete album stored data
export async function deleteAlbumData(album: Album) {
  try {
    await fs.remove(path.join("resources", "img", "posters", album.id ?? ""));
  } catch (error) {
    console.error(
      "deleteAlbumData: Error deleting images files and directories",
      error
    );
  }
}
