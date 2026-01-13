import { AlbumModel } from "@/api/v0/albums/infrastructure/persistence/models/AlbumModel";
import { MovieModel } from "@/api/v0/movies/infrastructure/persistence/models/MovieModel";
import { SeriesModel } from "@/api/v0/series/infrastructure/persistence/models/SeriesModel";
import {
  notificationService,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { existsSync } from "fs-extra";
import * as path from "path";
import { parse } from "path";

/**
 * Delete removed files from library
 * @param libraryId Library ID
 * @returns
 */
export async function clearLibrary(libraryId: string) {
  const library = await useCases.getLibrary().execute(libraryId);

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
        const episode = await useCases.getEpisodeByPath().execute(filePath);

        if (!episode) continue;

        const seasonId = episode.seasonId;
        await useCases.deleteEpisode().execute(episode.id);

        const season = await useCases.getSeasonById().execute(seasonId);

        if (!season || (season.episodes && season.episodes.length > 0))
          continue;

        const seriesId = season.seriesId;
        await useCases.deleteSeason().execute(seasonId);

        const series = await useCases.getSeriesById().execute(seriesId);

        if (!series || (series.seasons && series.seasons.length > 0)) continue;
        await useCases.deleteSeries().execute(seriesId);
      } else if (type === "Movies") {
        const movie = await useCases.getMovieByPath().execute(filePath);

        if (!movie) continue;

        await useCases.deleteMovie().execute(movie.id);
      } else {
        const song = await useCases.getSongByPath().execute(filePath);

        if (!song) continue;

        const albumId = song.albumId;
        await useCases.deleteSong().execute(song.id ?? "");

        const album = await useCases.getAlbumById().execute(albumId);

        const songs = await useCases.getSongsByAlbum().execute(albumId);

        if (!album || songs.length > 0) continue;

        await useCases.deleteAlbum().execute(albumId);
      }
    }
  }

  if (
    (type === "Shows" && library.series && library.series.length === 0) ||
    (type === "Movies" && library.movies && library.movies.length === 0) ||
    (type === "Music" && library.albums && library.albums.length === 0)
  ) {
    await useCases.deleteLibrary().execute(libraryId);
  }

  // Update library in client
  notificationService.mutateLibrary(libraryId);
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
      return MovieModel;
    case "Series":
      return SeriesModel;
    case "Shows":
      return SeriesModel;
    case "Music":
      return AlbumModel;
    default:
      throw new Error(`Invalid item type provided: ${type}`);
  }
}

export function extractNameAndYear(source: string) {
  // Remove parentheses and extra spaces
  const cleanSource = source
    .replace(/[()]/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Regex to get name and year
  const regex = /^(.*?)(?:[\s.-]*(\d{4}))?$/;
  const match = cleanSource.match(regex);

  let name = "";
  let year = "1";

  if (match) {
    name = match[1];
    year = match[2] || "1";
  } else {
    name = cleanSource;
  }

  // Clean and format the name
  name = name
    .replace(/[-_]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return [name, year];
}
