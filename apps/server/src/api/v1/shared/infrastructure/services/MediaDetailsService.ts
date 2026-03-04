import { Album } from "@/api/v1/albums/domain/Album";
import {
  fileSystemService,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";

import { extraTypes, videoExtensions } from "@/utils/constants";
import logger from "@/utils/logger";
import * as fs from "fs/promises";
import path from "path";
import {
  BadRequestException,
  NotFoundException,
} from "../web/exceptions/HTTPExceptions";

const mediaDetailsLogger = logger.child({ category: "Media Details" });

export class MediaDetailsService {
  /**
   * Fetches details for a single media item by type and ID.
   */
  public static async getDetails(type: string, id: string) {
    let result;
    switch (type) {
      case "collection":
        result = await useCases.getCollectionById().execute(id);
        // Sorting logic from the original endpoint can be applied here
        break;
      case "series":
        result = await useCases.getSeriesById().execute(id);
        break;
      case "season":
        result = await useCases.getSeasonById().execute(id);
        break;
      case "episode":
        result = await useCases.getEpisodeById().execute(id);
        break;
      case "video":
        result = await useCases.getVideoById().execute(id);
        break;
      case "movie":
        result = await useCases.getMoviebyId().execute(id);
        break;
      case "album":
        result = await useCases.getAlbumById().execute(id);
        break;
      case "seriesBySeasonId":
        result = await useCases.getSeasonById().execute(id);
        break;
      case "episode-video":
        result = await useCases.getVideoByEpisodeId().execute(id);
        break;
      case "movie-video":
        result = await useCases.getVideoByMovieId().execute(id);
        break;
      default:
        throw new BadRequestException(messages.errors.validation.invalidData);
    }
    if (!result) throw new NotFoundException();
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
      const season = await useCases.getSeasonById().execute(id);
      if (!season) throw new NotFoundException(messages.errors.notFound.season);
      item = await useCases.getSeriesById().execute(season.seriesId);
      if (!item) throw new NotFoundException(messages.errors.notFound.series);
    } else {
      item =
        itemType === "movie"
          ? await useCases.getMoviebyId().execute(id)
          : await useCases.getSeriesById().execute(id);
    }

    if (!item) throw new NotFoundException(messages.errors.notFound[itemType]);
    libraryId = item.libraryId;

    const folder = fileSystemService.getExternalPath(
      `resources/${mediaType}/${libraryId}/`
    );
    const filename = await fileSystemService.getFileInFolder(folder, item.id);
    if (!filename) throw new NotFoundException(messages.errors.notFound.file);

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
    const song = await useCases.getSongById().execute(songId);
    if (!song) {
      throw new NotFoundException(messages.errors.notFound.song);
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
      mediaDetailsLogger.error(error, "Error searching for lyrics");
      throw new Error("An internal error occurred while searching for lyrics.");
    }
  }

  /**
   * Finds extra video files (concerts, interviews, etc.) in the folders
   * of albums belonging to a specific collection.
   * @param collectionId - The ID of the music collection.
   * @returns A promise that resolves to a flat array of all found extra media.
   */
  public static async findMusicExtras(collectionId: string) {
    const collection = await useCases.getCollectionById().execute(collectionId);
    if (!collection) {
      throw new NotFoundException(messages.errors.notFound.collection);
    }

    const rootFolders = new Set<string>();
    collection.albums.forEach(
      (album: Album) => album.folder && rootFolders.add(album.folder)
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
