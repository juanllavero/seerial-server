import { existsSync } from "fs-extra";
import * as path from "path";
import { parse } from "path";
import { Album, Movie, Series } from "../data/models";
import {
  deleteAlbum,
  deleteEpisode,
  deleteLibrary,
  deleteMovie,
  deleteSeason,
  deleteSeries,
  deleteSong,
} from "../db/delete/deleteData";
import {
  getAlbumById,
  getEpisodeByPath,
  getLibraryById,
  getMovieByPath,
  getSeasonById,
  getSeriesById,
  getSongByPath,
} from "../db/get/getData";
import { Utils } from "../utils/Utils";
import { WebSocketManager } from "../WebSockets/WebSocketManager";

/**
 * Delete removed files from library
 * @param libraryId Library ID
 * @param wsManager Websocket manager to send updates to client
 * @returns
 */
export async function clearLibrary(
  libraryId: string,
  wsManager: WebSocketManager
) {
  const library = await getLibraryById(libraryId);

  if (
    !library ||
    Object.keys(library.analyzedFiles).length === 0 ||
    !library.folders ||
    library.folders.length === 0
  )
    return;

  const type = library.type;

  // Map to associate each file with its closest root folder
  const fileToRootFolder: Record<string, string> = {};

  // Group files by their root folder
  for (const filePath of Object.keys(library.analyzedFiles)) {
    const matchingRootFolder = library.folders
      .filter((folder: string) => filePath.startsWith(folder))
      .sort((a: string, b: string) => b.length - a.length)[0]; // Sort by length in descending order to get the most specific one

    if (matchingRootFolder) {
      fileToRootFolder[filePath] = matchingRootFolder;
    } else {
      // If there is no matching root folder, use the file's root
      const { root } = parse(filePath);
      fileToRootFolder[filePath] = root;
    }
  }

  // Check each root folder and its associated files
  const checkedRoots = new Set<string>(); // To avoid checking the same root multiple times

  for (const [filePath, rootFolder] of Object.entries(fileToRootFolder)) {
    const resolvedRoot = path.resolve(rootFolder);

    if (!checkedRoots.has(resolvedRoot)) {
      if (!existsSync(resolvedRoot)) {
        console.log(
          `Root folder ${resolvedRoot} is not connected. Its files will be skipped.`
        );
        checkedRoots.add(resolvedRoot);
        continue;
      }
      checkedRoots.add(resolvedRoot);
    }

    // If the root is connected, check the file
    const fileExists = existsSync(filePath);

    if (!fileExists) {
      if (type === "Shows") {
        const episode = await getEpisodeByPath(filePath);

        if (!episode) continue;

        const seasonId = episode.seasonId;
        await deleteEpisode(episode.id);

        const season = await getSeasonById(seasonId);

        if (!season || (season.episodes && season.episodes.length > 0))
          continue;

        const seriesId = season.seriesId;
        await deleteSeason(seasonId);

        const series = await getSeriesById(seriesId);

        if (!series || (series.seasons && series.seasons.length > 0)) continue;
        await deleteSeries(seriesId);
      } else if (type === "Movies") {
        const movie = await getMovieByPath(filePath);

        if (!movie) continue;

        await deleteMovie(movie.id);
      } else {
        const song = await getSongByPath(filePath);

        if (!song) continue;

        const albumId = song.albumId;
        await deleteSong(song.id);

        const album = await getAlbumById(albumId);

        if (!album || (album.songs && album.songs.length > 0)) continue;

        await deleteAlbum(albumId);
      }
    }
  }

  if (
    (type === "Shows" && library.series && library.series.length === 0) ||
    (type === "Movies" && library.movies && library.movies.length === 0) ||
    (type === "Music" && library.albums && library.albums.length === 0)
  ) {
    await deleteLibrary(libraryId);
  }

  // Update library in client
  Utils.mutateLibrary(wsManager);
}

/**
 * Returns the key to use in the collection of items
 * @param value model name
 * @returns key
 */
export function getCollectionItemsKey(value: string) {
  switch (value) {
    case "Movies":
      return "movies";
    case "Series":
      return "shows";
    case "Shows":
      return "shows";
    case "Music":
      return "albums";
    default:
      throw new Error(`Invalid item value provided: ${value}`);
  }
}

/**
 * Returns the corresponding model for a given item type
 * @param type item type ('Movies', 'Shows', 'Music').
 * @returns model (Movie, Series, o Album).
 */
export function getItemModel(type: string) {
  switch (type) {
    case "Movies":
      return Movie;
    case "Series":
      return Series;
    case "Shows":
      return Series;
    case "Music":
      return Album;
    default:
      throw new Error(`Invalid item type provided: ${type}`);
  }
}
