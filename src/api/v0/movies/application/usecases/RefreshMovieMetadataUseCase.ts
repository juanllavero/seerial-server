import { MetadataManager } from "@/managers/MetadataManager";

/**
 * Refresh all metadata of an existing movie and its associated videos.
 * It does not re-scan the files, it only uses the existing themdbId.
 * * @param movieId The ID of the movie in the local database.
 */
export class RefreshMovieMetadataUseCase {
  constructor() {}

  async execute(movieId: string): Promise<void> {
    const movie = await getMovieById(movieId);
    if (!movie) {
      console.error(`[Updater] No movie found: ${movieId}`);
      return;
    }

    const library = await getLibraryById(movie.libraryId);
    if (!library) {
      console.error(`[Updater] No library found for movie: ${movie.name}`);
      return;
    }

    try {
      // Update UI
      movie.analyzingFiles = true;
      await movie.save();
      getNotificationService().mutateMovie(movie);

      // Get metadata from TheMovieDB
      const movieMetadata = await MovieDBWrapper.getMovie(
        movie.themdbId,
        library.language
      );
      if (!movieMetadata) {
        throw new Error(
          `No metadata found in TheMovieDB for movie: ${movie.themdbId}`
        );
      }

      // Update movie metadata
      await MetadataManager.updateMovieMetadata(
        movie,
        movieMetadata,
        library.language
      );

      // Update videos metadata
      const videos = await getVideoByMovieId(movie.id);
      if (videos) {
        for (const video of videos) {
          await MetadataManager.updateVideoMetadataForMovie(video, movie);
        }
      }
    } catch (error) {
      console.error(`[Updater] Error refreshing movie "${movie.name}":`, error);
    } finally {
      // Update UI
      movie.analyzingFiles = false;
      await movie.save();
      getNotificationService().mutateMovie(movie);
      getNotificationService().mutateLibrary(library.id);
    }
  }
}
