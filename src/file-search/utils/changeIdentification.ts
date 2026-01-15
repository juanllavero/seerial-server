import {
  notificationService,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";

export async function changeIdentificationShow(
  showId: string,
  newTheMovieDBID: number,
  newepisodeGroupId?: string
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

export async function changeIdentificationMovie(
  movieId: string,
  newTheMovieDBID: number
) {
  const movie = await useCases.getMoviebyId().execute(movieId);

  if (!movie) return;

  // Delete previous data
  await useCases.deleteMovieData().execute(movie.id);

  const library = await useCases.getLibrary().execute(movie.libraryId);

  if (!library) return;

  // Restore folder in library
  await useCases
    .addAnalyzedFolder()
    .execute(library.id, movie.folder, movie.id);

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
