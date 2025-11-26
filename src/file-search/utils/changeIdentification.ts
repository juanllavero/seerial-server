import {
  notificationService,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";

const getLibraryById = useCases.getLibrary();
const getSeriesById = useCases.getSeriesById();
const deleteSeriesData = useCases.deleteSeries();
const scanTVShow = useCases.scanSeries();
const getMovieById = useCases.getMoviebyId();
const deleteMovieData = useCases.deleteMovie();
const scanMovie = useCases.scanMovie();
const getVideoByMovieId = useCases.getVideoByMovieId();
const deleteVideo = useCases.deleteVideo();
const updateSeries = useCases.updateSeries();
const updateMovie = useCases.updateMovie();
const addAnalyzedFolder = useCases.addAnalyzedFolder();

export async function changeIdentificationShow(
  showId: string,
  newTheMovieDBID: number,
  newepisodeGroupId?: string
) {
  const show = await getSeriesById.execute(showId);

  if (!show) return;

  // Delete previous data
  await deleteSeriesData.execute(show.id);

  const library = await getLibraryById.execute(show.libraryId);

  if (!library) return;

  // Restore folder stored in library
  await addAnalyzedFolder.execute(library.id, show.folder, show.id);

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
  updateSeries.execute(show.id, show);

  notificationService.mutateSeries(show);
  notificationService.mutateSeason();
  notificationService.mutateLibrary(library.id);

  // Get new data
  await scanTVShow.execute(library, show.folder);
}

export async function changeIdentificationMovie(
  movieId: string,
  newTheMovieDBID: number
) {
  const movie = await getMovieById.execute(movieId);

  if (!movie) return;

  // Delete previous data
  await deleteMovieData.execute(movie.id);

  const library = await getLibraryById.execute(movie.libraryId);

  if (!library) return;

  // Restore folder in library
  await addAnalyzedFolder.execute(library.id, movie.folder, movie.id);

  // Remove videos
  const videos = await getVideoByMovieId.execute(movieId);

  if (videos) {
    for (const video of videos) {
      deleteVideo.execute(video.id);
    }
  }

  // Update TheMovieDB ID
  movie.themdbId = newTheMovieDBID;

  // Save changes in DB
  updateMovie.execute(movie.id, movie);

  notificationService.mutateMovie(movie);
  notificationService.mutateLibrary(library.id);

  // Get new data
  await scanMovie.execute(library, movie.folder);
}
