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
import { WebSocketManager } from "../WebSockets/WebSocketManager";
import { scanMovie } from "./movies/searchMovies";

import { scanTVShow } from "./series/searchSeries";
export async function updateShowMetadata(
  libraryId: string,
  showId: string,
  newTheMovieDBID: number,
  wsManager: WebSocketManager,
  newepisodeGroupId?: string
) {
  const library = await getLibraryById(libraryId);

  if (!library) return;

  const show = await getSeriesById(showId);

  if (!show) return;

  // Delete previous data
  await deleteSeriesData(library.id, show);

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
  //Utils.updateSeries(wsManager, library.id, show);

  // Get new data
  await scanTVShow(library, show.folder, wsManager);
}

export async function updateMovieMetadata(
  libraryId: string,
  movieId: string,
  newTheMovieDBID: number,
  wsManager: WebSocketManager
) {
  const library = await getLibraryById(libraryId);

  if (!library) return;

  const movie = await getMovieById(movieId);

  if (!movie) return;

  // Delete previous data
  await deleteMovieData(library.id, movie);

  // Restore folder in library
  await library.addAnalyzedFolder(movie.folder, movie.id);

  // Remove videos
  const videos = await getVideoByMovieId(movieId);

  if (videos) {
    for (const video of videos) {
      deleteVideoData(libraryId, video);
      deleteVideo(video.id);
    }
  }

  // Update TheMovieDB ID
  movie.themdbId = newTheMovieDBID;

  // Save changes in DB
  movie.save();
  //Utils.updateSeries(wsManager, library.id, collection);

  // Get new data
  await scanMovie(library, movie.folder, wsManager);
}
