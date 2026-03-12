import * as path from 'node:path';
import { parse } from 'node:path';
import { existsSync } from 'fs-extra';
import { AlbumModel } from '@/api/v1/albums/infrastructure/persistence/models/AlbumModel';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
import {
  notificationService,
  useCases,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import logger from '@/utils/logger';

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

  const fileToRootFolder = getFileToRootFolderMap(
    Object.keys(library.analyzedFiles),
    library.folders,
  );
  const type = library.type;
  const rootConnectivity = new Map<string, boolean>();

  for (const [filePath, rootFolder] of Object.entries(fileToRootFolder)) {
    if (!isRootConnected(rootFolder, rootConnectivity)) continue;
    if (existsSync(filePath)) continue;

    await removeMissingFileFromLibrary(library.type, filePath);
  }

  if (
    (type === 'Shows' && library.series && library.series.length === 0) ||
    (type === 'Movies' && library.movies && library.movies.length === 0) ||
    (type === 'Music' && library.albums && library.albums.length === 0)
  ) {
    await useCases.deleteLibrary().execute(libraryId);
  }

  // Update library in client
  notificationService.mutateLibrary(libraryId);
}

function getFileToRootFolderMap(filePaths: string[], folders: string[]): Record<string, string> {
  const fileToRootFolder: Record<string, string> = {};

  for (const filePath of filePaths) {
    const matchingRootFolder = folders
      .filter((folder) => filePath.startsWith(folder))
      .sort((a, b) => b.length - a.length)[0];

    fileToRootFolder[filePath] = matchingRootFolder || parse(filePath).root;
  }

  return fileToRootFolder;
}

function isRootConnected(rootFolder: string, rootConnectivity: Map<string, boolean>): boolean {
  const resolvedRoot = path.resolve(rootFolder);
  const cached = rootConnectivity.get(resolvedRoot);
  if (cached !== undefined) return cached;

  if (existsSync(resolvedRoot)) {
    rootConnectivity.set(resolvedRoot, true);
    return true;
  }

  logger.info(`Root folder ${resolvedRoot} is not connected. Its files will be skipped.`);
  rootConnectivity.set(resolvedRoot, false);
  return false;
}

async function removeMissingFileFromLibrary(type: string, filePath: string): Promise<void> {
  if (type === 'Shows') {
    await removeMissingShowFile(filePath);
    return;
  }

  if (type === 'Movies') {
    await removeMissingMovieFile(filePath);
    return;
  }

  await removeMissingMusicFile(filePath);
}

async function removeMissingShowFile(filePath: string): Promise<void> {
  const episode = await useCases.getEpisodeByPath().execute(filePath);
  if (!episode) return;

  await useCases.deleteEpisode().execute(episode.id);

  const season = await useCases.getSeasonById().execute(episode.seasonId);
  if (!season || (season.episodes && season.episodes.length > 0)) return;

  await useCases.deleteSeries().execute(season.seriesId);
}

async function removeMissingMovieFile(filePath: string): Promise<void> {
  const movie = await useCases.getMovieByPath().execute(filePath);
  if (!movie) return;
  await useCases.deleteMovie().execute(movie.id);
}

async function removeMissingMusicFile(filePath: string): Promise<void> {
  const song = await useCases.getSongByPath().execute(filePath);
  if (!song) return;

  const albumId = song.albumId;
  await useCases.deleteSong().execute(song.id ?? '');

  const album = await useCases.getAlbumById().execute(albumId);
  const songs = await useCases.getSongsByAlbum().execute(albumId);
  if (!album || songs.length > 0) return;

  await useCases.deleteAlbum().execute(albumId);
}

/**
 * Returns the key to use in the collection of items
 * @param value model name
 * @returns key
 */
export function getCollectionItemsKey(value: string) {
  switch (value) {
    case 'Movies':
      return 'movies';
    case 'Series':
      return 'shows';
    case 'Shows':
      return 'shows';
    case 'Music':
      return 'albums';
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
    case 'Movies':
      return MovieModel;
    case 'Series':
      return SeriesModel;
    case 'Shows':
      return SeriesModel;
    case 'Music':
      return AlbumModel;
    default:
      throw new Error(`Invalid item type provided: ${type}`);
  }
}

export function extractNameAndYear(source: string) {
  // Remove parentheses and extra spaces
  const cleanSource = source
    .replace(/[()]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Regex to get name and year
  const regex = /^(.*?)(?:[\s.-]*(\d{4}))?$/;
  const match = cleanSource.match(regex);

  let name = '';
  let year = '1';

  if (match) {
    name = match[1];
    year = match[2] || '1';
  } else {
    name = cleanSource;
  }

  // Clean and format the name
  name = name
    .replace(/[-_]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return [name, year];
}

export async function changeIdentificationShow(
  showId: string,
  newTheMovieDBID: number,
  newepisodeGroupId?: string,
) {
  const show = await useCases.getSeriesById().execute(showId);

  if (!show) return;

  // Delete previous data
  await useCases.deleteSeriesData().execute(show.id);

  const library = await useCases.getLibrary().execute(show.libraryId);

  if (!library) return;

  // Restore folder stored in library
  await useCases.addAnalyzedFolder().execute(library.id, show.folder, show.id);

  // Clear season list
  show.seasons = [];

  // Update TheMovieDB ID
  show.themdbId = newTheMovieDBID;

  // Update EpisodeGroup ID if param is passed
  if (newepisodeGroupId) {
    show.episodeGroupId = newepisodeGroupId;
  }

  // Set element loading to show in client
  show.analyzingFiles = true;

  // Save changes in DB
  useCases.updateSeries().execute(show.id, show);

  notificationService.mutateSeries(show);
  notificationService.mutateSeason();
  notificationService.mutateLibrary(library.id);

  // Get new data
  await useCases.scanSeries().execute(library, show.folder);
}

export async function changeIdentificationMovie(movieId: string, newTheMovieDBID: number) {
  const movie = await useCases.getMoviebyId().execute(movieId);

  if (!movie) return;

  // Delete previous data
  await useCases.deleteMovieData().execute(movie.id);

  const library = await useCases.getLibrary().execute(movie.libraryId);

  if (!library) return;

  // Restore folder in library
  await useCases.addAnalyzedFolder().execute(library.id, movie.folder, movie.id);

  // Remove videos
  const videos = await useCases.getVideoByMovieId().execute(movieId);

  if (videos) {
    for (const video of videos) {
      useCases.deleteVideo().execute(video.id);
    }
  }

  // Update TheMovieDB ID
  movie.themdbId = newTheMovieDBID;

  // Save changes in DB
  useCases.updateMovie().execute(movie.id, movie);

  notificationService.mutateMovie(movie);
  notificationService.mutateLibrary(library.id);

  // Get new data
  await useCases.scanMovie().execute(library, movie.folder);
}
