import {
  getLibraryById,
  getLibraryByVideoId,
} from "@/api/v0/libraries/libraries.service";
import fs from "fs-extra";
import path from "path";
import { VideoData } from "./videos.types";

export async function deleteVideoData(video: VideoData) {
  try {
    await fs.remove(
      path.join("resources", "img", "thumbnails", "video", video.id ?? "")
    );
    await fs.remove(
      path.join("resources", "img", "thumbnails", "chapters", video.id ?? "")
    );
  } catch (error) {
    console.error(
      "deleteVideoData: Error deleting images directories" + video.id,
      error
    );
  }

  const libraryId = await getLibraryByVideoId(video.id ?? "");

  if (!libraryId) return;

  const library = await getLibraryById(libraryId);

  if (library && video) await library.removeAnalyzedFile(video.fileSrc);
}
