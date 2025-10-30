import { getEpisodes } from "@/api/v0/episodes/episodes.service";
import { getLibraryById } from "@/api/v0/libraries/libraries.service";
import { getMovieById } from "@/api/v0/movies/movies.service";
import { getSeasons } from "@/api/v0/seasons/seasons.service";
import { getSeriesById } from "@/api/v0/series/series.service";
import { getNotificationService } from "@/api/v0/shared/infrastructure/adapters/notification/NotificationServiceInstance";
import {
  getVideoByEpisodeId,
  getVideoByMovieId,
} from "@/api/v0/videos/videos.service";
import { MetadataManager } from "@/managers/MetadataManager";
import { MovieDBWrapper } from "@/theMovieDB/MovieDB";

/**
 * Refresh all metadata of an existing movie and its associated videos.
 * It does not re-scan the files, it only uses the existing themdbId.
 * * @param movieId The ID of the movie in the local database.
 */
export async function refreshMovieMetadata(movieId: string): Promise<void> {
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

/**
 * Refreshes all the metadata of an existing series, including all its seasons and episodes.
 * It does not re-scan the files, it only uses the existing themdbId.
 * * @param seriesId The ID of the series in the local database.
 */
export async function refreshSeriesMetadata(seriesId: string): Promise<void> {
  const series = await getSeriesById(seriesId);
  if (!series) {
    console.error(`[Updater] Show not found: ${seriesId}`);
    return;
  }

  const library = await getLibraryById(series.libraryId);
  if (!library) {
    console.error(`[Updater] Library not found for show: ${series.name}`);
    return;
  }

  try {
    // Update UI
    series.analyzingFiles = true;
    await series.save();
    getNotificationService().mutateSeries(series);

    // Update show metadata
    await MetadataManager.updateSeriesMetadata(series, library.language);

    // Update seasons and episodes metadata
    const seasons = await getSeasons(series.id);
    if (seasons) {
      for (const season of seasons) {
        await MetadataManager.updateSeasonMetadata(season, series);

        // Get season metadata from TMDb
        const seasonTMDb = await MovieDBWrapper.getSeason(
          series.themdbId,
          season.seasonNumber,
          library.language
        );
        if (!seasonTMDb?.episodes) continue;

        const episodes = await getEpisodes(season.id);
        if (episodes) {
          for (const episode of episodes) {
            const episodeTMDb = seasonTMDb.episodes.find(
              (e) => e.episode_number === episode.episodeNumber
            );
            const video = await getVideoByEpisodeId(episode.id);

            if (episodeTMDb && video) {
              await MetadataManager.updateEpisodeMetadata(
                episode,
                video,
                series,
                episodeTMDb
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`[Updater] Error refreshing show "${series.name}":`, error);
  } finally {
    // Update UI
    series.analyzingFiles = false;
    await series.save();
    getNotificationService().mutateSeries(series);
    getNotificationService().mutateSeason();
    getNotificationService().mutateLibrary(library.id);
  }
}
