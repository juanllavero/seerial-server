import { getAlbumById } from "@/api/v0/albums/albums.service";
import { getCollectionById } from "@/api/v0/collections/collections.service";
import { getEpisodeById } from "@/api/v0/episodes/episodes.service";
import { getMovieById } from "@/api/v0/movies/movies.service";
import { getSeasonById } from "@/api/v0/seasons/seasons.service";
import { getSeriesById } from "@/api/v0/series/series.service";
import { getSongById } from "@/api/v0/songs/songs.service";
import {
  getVideoByEpisodeId,
  getVideoById,
  getVideoByMovieId,
} from "@/api/v0/videos/videos.service";
import { messages } from "@/config/messages";

import ApiError from "@/data/ApiError";
import { FilesManager } from "@/managers/FilesManager";
import { extraTypes, videoExtensions } from "@/utils/utils";
import * as fs from "fs/promises";
import path from "path";

export class MediaDetailsManager {
  /**
   * Fetches details for a single media item by type and ID.
   */
  public static async getDetails(type: string, id: string) {
    let result;
    switch (type) {
      case "collection":
        result = await getCollectionById(id);
        // Sorting logic from the original endpoint can be applied here
        break;
      case "series":
        result = await getSeriesById(id);
        break;
      case "season":
        result = await getSeasonById(id);
        break;
      case "episode":
        result = await getEpisodeById(id);
        break;
      case "video":
        result = await getVideoById(id);
        break;
      case "movie":
        result = await getMovieById(id);
        break;
      case "album":
        result = await getAlbumById(id);
        break;
      case "seriesBySeasonId":
        result = await getSeasonById(id);
        break;
      case "episode-video":
        result = await getVideoByEpisodeId(id);
        break;
      case "movie-video":
        result = await getVideoByMovieId(id);
        break;
      default:
        throw new ApiError(400, messages.errors.validation.invalidData);
    }
    if (!result) throw new ApiError(404, `${type} with ID ${id} not found.`);
    return result;
  }

  /**
   * Finds a background media file (video or music) for a given media item.
   */
  public static async findMediaBackground(
    mediaType: "video" | "music",
    itemType: "movie" | "series" | "season",
    id: string
  ) {
    let item: any;
    let libraryId: string;

    if (itemType === "season") {
      const season = await getSeasonById(id);
      if (!season) throw new ApiError(404, "Season not found.");
      item = await getSeriesById(season.seriesId);
      if (!item) throw new ApiError(404, "Associated series not found.");
    } else {
      item =
        itemType === "movie" ? await getMovieById(id) : await getSeriesById(id);
    }

    if (!item) throw new ApiError(404, `${itemType} not found.`);
    libraryId = item.libraryId;

    const folder = FilesManager.getExternalPath(
      `resources/${mediaType}/${libraryId}/`
    );
    const filename = FilesManager.getFileInFolder(folder, item.id);
    if (!filename) throw new ApiError(404, "Background media file not found.");

    return {
      url: `/media/${mediaType}/${libraryId}/${path.basename(filename)}`,
    };
  }

  /**
   * Searches for and reads LRC lyric files matching a given song.
   * @param songId - The ID of the song.
   * @returns A promise that resolves to an array of lyric objects.
   */
  public static async findLyricsForSong(songId: string) {
    const song = await getSongById(songId);
    if (!song) {
      throw new ApiError(404, "Song not found.");
    }

    try {
      const songDirectory = path.dirname(song.fileSrc);
      const songBaseName = path.basename(
        song.fileSrc,
        path.extname(song.fileSrc)
      );
      const filesInDir = await fs.readdir(songDirectory);

      const lyricFileNames = filesInDir.filter(
        (file) => file.startsWith(songBaseName) && file.endsWith(".lrc")
      );

      const promises = lyricFileNames.map(async (fileName) => {
        const potentialLangPart = fileName.substring(
          songBaseName.length,
          fileName.length - ".lrc".length
        );
        let language = "original";
        if (potentialLangPart.startsWith(".")) {
          language = potentialLangPart.substring(1);
        } else if (potentialLangPart !== "") {
          return null; // Ignore files that don't match the pattern (e.g., song-copy.lrc)
        }

        const fullPath = path.join(songDirectory, fileName);
        const content = await fs.readFile(fullPath, "utf-8");
        return { content, language };
      });

      const results = await Promise.all(promises);
      return results.filter((result) => result !== null);
    } catch (error) {
      console.error("Error searching for lyrics:", error);
      throw new ApiError(
        500,
        "An internal error occurred while searching for lyrics."
      );
    }
  }

  /**
   * Finds extra video files (concerts, interviews, etc.) in the folders
   * of albums belonging to a specific collection.
   * @param collectionId - The ID of the music collection.
   * @returns A promise that resolves to a flat array of all found extra media.
   */
  public static async findMusicExtras(collectionId: string) {
    const collection = await getCollectionById(collectionId);
    if (!collection) {
      throw new ApiError(404, "Collection not found.");
    }

    const rootFolders = new Set<string>();
    collection.albums.forEach(
      (album) => album.folder && rootFolders.add(album.folder)
    );

    const promises = Array.from(rootFolders).map(async (folder) => {
      const foundExtras: { title: string; src: string; type: string }[] = [];

      // Check for the existence of 'extras' or 'Extras'
      const extrasPathCandidates = [
        path.join(folder, "extras"),
        path.join(folder, "Extras"),
      ];
      let extrasPath: string | undefined;

      for (const candidate of extrasPathCandidates) {
        try {
          // fs.stat will throw an error if the directory does not exist
          const stats = await fs.stat(candidate);
          if (stats.isDirectory()) {
            extrasPath = candidate;
            break; // We found one, no need to search further
          }
        } catch (error) {
          // Ignore the error (ENOENT: file not found) and continue
        }
      }

      if (!extrasPath) {
        return []; // There is no 'extras' folder in this path, return an empty array
      }

      // Read the contents of the 'extras' directory
      const files = await fs.readdir(extrasPath);

      for (const file of files) {
        const fileExt = path.extname(file).toLowerCase();

        // Only process if it is a known video file
        if (!videoExtensions.includes(fileExt)) {
          continue;
        }

        const baseName = path.basename(file, fileExt);

        // Check if the filename ends with any of the extra suffixes
        for (const type of extraTypes) {
          const suffix = `-${type}`;
          if (baseName.endsWith(suffix)) {
            // Extract the title according to the rules
            const nameWithoutSuffix = baseName.substring(
              0,
              baseName.length - suffix.length
            );
            const titleParts = nameWithoutSuffix.split(" - ");

            const title =
              titleParts.length > 1
                ? titleParts.slice(1).join(" - ").trim()
                : nameWithoutSuffix.trim();

            // Create the final object
            foundExtras.push({
              title,
              src: path.join(extrasPath, file), // Full path to the file
              type: type, // The type of extra without the dash
            });

            break; // Move to the next file once a type is found
          }
        }
      }

      return foundExtras;
    });

    const results = await Promise.all(promises);
    return results.flat();
  }
}
