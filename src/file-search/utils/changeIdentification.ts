import { getLibraryById } from "@/api/v0/libraries/libraries.service";
import { deleteMovieData } from "@/api/v0/movies/movies.controller";
import { getMovieById } from "@/api/v0/movies/movies.service";
import { deleteSeriesData } from "@/api/v0/series/series.controller";
import { getSeriesById } from "@/api/v0/series/series.service";
import { deleteVideoData } from "@/api/v0/videos/videos.controller";
import { deleteVideo, getVideoByMovieId } from "@/api/v0/videos/videos.service";
import { scanMovie } from "@/file-search/movies/searchMovies";
import { scanTVShow } from "@/file-search/series/searchSeries";
import { WebSocketManager } from "@/managers/WebSocketManager";

export async function changeIdentificationShow(
  showId: string,
  newTheMovieDBID: number,
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
  WebSocketManager.mutateSeries(show);
  WebSocketManager.mutateSeason();
  WebSocketManager.mutateLibrary(library.id);

  // Get new data
  await scanTVShow(library, show.folder);
}

export async function changeIdentificationMovie(
  movieId: string,
  newTheMovieDBID: number
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
  WebSocketManager.mutateMovie(movie);
  WebSocketManager.mutateLibrary(library.id);

  // Get new data
  await scanMovie(library, movie.folder);
}
