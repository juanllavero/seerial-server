import {
  deleteMovieData,
  deleteSeriesData,
  deleteVideo,
  deleteVideoData,
} from "../db/delete/deleteData";
import {
  getLibraryById,
  getMovieById,
  getSeriesById,
  getVideoByMovieId,
} from "../db/get/getData";
import { Utils } from "../utils/Utils";
import { WebSocketManager } from "../WebSockets/WebSocketManager";
import { scanMovie } from "./movies/searchMovies";

import { scanTVShow } from "./series/searchSeries";
export async function updateShowMetadata(
  showId: string,
  newTheMovieDBID: number,
  wsManager: WebSocketManager,
  newepisodeGroupId?: string
) {
  const show = await getSeriesById(showId);

  if (!show) return;

  // Delete previous data
  await deleteSeriesData(show.libraryId, show);

  const library = await getLibraryById(show.libraryId);

  if (!library) return;

  // Restore folder stored in library
  await library.addAnalyzedFolder(show.folder, show.id);

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
  show.save();
  Utils.mutateSeries(wsManager);
  Utils.mutateSeason(wsManager);
  Utils.mutateLibrary(wsManager);

  // Get new data
  await scanTVShow(library, show.folder, wsManager);
}

export async function updateMovieMetadata(
  movieId: string,
  newTheMovieDBID: number,
  wsManager: WebSocketManager
) {
  const movie = await getMovieById(movieId);

  if (!movie) return;

  // Delete previous data
  await deleteMovieData(movie.libraryId, movie);

  const library = await getLibraryById(movie.libraryId);

  if (!library) return;

  // Restore folder in library
  await library.addAnalyzedFolder(movie.folder, movie.id);

  // Remove videos
  const videos = await getVideoByMovieId(movieId);

  if (videos) {
    for (const video of videos) {
      deleteVideoData(video);
      deleteVideo(video.id);
    }
  }

  // Update TheMovieDB ID
  movie.themdbId = newTheMovieDBID;

  // Save changes in DB
  movie.save();
  Utils.mutateMovie(wsManager);
  Utils.mutateLibrary(wsManager);

  // Get new data
  await scanMovie(library, movie.folder, wsManager);
}
