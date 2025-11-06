import { deleteAlbum, getAlbumById } from "@/api/v0/albums/albums.service";
import {
  deleteEpisode,
  getEpisodeByPath,
} from "@/api/v0/episodes/episodes.service";
import { Album, Movie, Series } from "@/api/v0/index.models";
import {
  deleteLibrary,
  getLibraryById,
} from "@/api/v0/libraries/libraries.service";
import { deleteMovie, getMovieByPath } from "@/api/v0/movies/movies.service";
import { deleteSeason, getSeasonById } from "@/api/v0/seasons/seasons.service";
import { deleteSeries, getSeriesById } from "@/api/v0/series/series.service";
import { fileSystemService } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { getNotificationService } from "@/api/v0/shared/infrastructure/adapters/notification/NotificationServiceInstance";
import { deleteSong, getSongByPath } from "@/api/v0/songs/songs.service";
import { promises as fsPromises } from "fs";
import { existsSync } from "fs-extra";
import { Episode as MovieDBEpisode, TvSeasonResponse } from "moviedb-promise";
import * as path from "path";
import { parse } from "path";

/**
 * Delete removed files from library
 * @param libraryId Library ID
 * @returns
 */
export async function clearLibrary(libraryId: string) {
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
  getNotificationService().mutateLibrary(libraryId);
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

/**
 * Function to detect episode and season numbers in a video file name
 * @param filename path to the video file
 * @returns array of 1 to 2 elements corresponding with the episode and season number detected, or NaN if no episode was found
 */
export function extractEpisodeSeason(filename: string): [number, number?] {
  const regexPatterns = [
    /[Ss](\d{1,4})[Ee](\d{1,4})(?:v\d+)?/i, // S01E02, s1e2, S1.E2, S01E01v2
    /[Ss](\d{1,4})[\.]?E(\d{1,4})(?:v\d+)?/i, // S1.E2, S1.E2v1
    /[Ss](\d{1,4})[\s\-]+Ep?(\d{1,4})(?:v\d+)?/i, // S01 E02, S1 E2, con v2 opcional
    /-\s?(\d{1,4})(?:v\d+)?(?!p)/, // - 01, - 01v1 (anime style)
    /(?:\b|^)(\d{1,4})(?:[^\d]+(\d{1,4}))?/i, // General case
  ];

  for (const regex of regexPatterns) {
    const match = filename.match(regex);
    if (match) {
      let episode, season;
      if (regex === regexPatterns[3] && match[2]) {
        // Only consider the second number as the episode if two numbers are present
        episode = parseInt(match[2], 10);
        season = undefined;
      } else {
        episode = parseInt(match[2] ?? match[1], 10);
        season = match[2] ? parseInt(match[1], 10) : undefined;
      }
      return season ? [episode, season] : [episode];
    }
  }

  return [NaN]; // Return NaN if no episode found
}

// Index episodes and seasons of a show to quicker access
export function indexSeasons(
  seasonsMetadata: TvSeasonResponse[]
): Map<
  number,
  { season: TvSeasonResponse; episodesMap: Map<number, MovieDBEpisode> }
> {
  const index = new Map<
    number,
    { season: TvSeasonResponse; episodesMap: Map<number, MovieDBEpisode> }
  >();

  for (const season of seasonsMetadata) {
    if (season.season_number != null) {
      const episodesMap = new Map<number, MovieDBEpisode>();
      if (season.episodes) {
        for (const episode of season.episodes) {
          if (episode.episode_number != null) {
            episodesMap.set(episode.episode_number, episode);
          }
        }
      }
      index.set(season.season_number, { season, episodesMap });
    }
  }
  return index;
}

// Function to build an array with the cumulative count of episodes by season.
export function buildCumulativeEpisodes(
  seasonsMetadata: TvSeasonResponse[]
): number[] {
  const cumulative: number[] = [];
  let total = 0;

  for (const season of seasonsMetadata) {
    if (
      season.season_number != null &&
      season.season_number >= 1 &&
      season.episodes
    ) {
      total += season.episodes.length;
      cumulative.push(total);
    }
  }
  return cumulative;
}

// Returns the season and episode by absolute number
export function getSeasonEpisodeByAbsoluteNumber(
  absoluteNumber: number,
  seasonsMetadata: TvSeasonResponse[],
  cumulative: number[]
): { season: TvSeasonResponse; episode: MovieDBEpisode } | null {
  for (let i = 0; i < cumulative.length; i++) {
    if (absoluteNumber <= cumulative[i]) {
      const season = seasonsMetadata[i];
      const previousCount = i > 0 ? cumulative[i - 1] : 0;
      const episodeIndex = absoluteNumber - previousCount - 1; // Index from 0
      if (season.episodes && season.episodes[episodeIndex]) {
        return { season, episode: season.episodes[episodeIndex] };
      }
    }
  }
  return null;
}

/**
 * Helper function to handle cover art logic.
 * @param entity An object with an ID and a property to store the image path (e.g., Album or Collection)
 * @param propertyName The name of the property to update (e.g., 'coverSrc')
 * @param sourceImagePath The path of the image to copy.
 */
export async function setEntityCover(
  entity: { id: string; [key: string]: any },
  propertyName: string,
  sourceImagePath: string
) {
  const imageName = path.basename(sourceImagePath);
  const destinationFolder = fileSystemService.getExternalPath(
    path.join("resources", "img", "posters", entity.id)
  );
  const destinationPath = path.join(destinationFolder, imageName);

  try {
    fileSystemService.createFolder(destinationFolder);
    await fsPromises.copyFile(sourceImagePath, destinationPath);

    entity[propertyName] = path
      .join("resources", "img", "posters", entity.id, imageName)
      .replace(/\\/g, "/");
  } catch (err) {
    console.error(`Error copying image for entity ${entity.id}:`, err);
  }
}
