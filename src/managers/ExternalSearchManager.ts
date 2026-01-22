import {
  imdbScoreService,
  metadataProvider,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import ApiError from "@/data/ApiError"; // Adjust path
import { DownloaderManager } from "@/managers/DownloaderManager"; // Adjust path
import logger from "../utils/logger";

const externalSearchLogger = logger.child({ category: "External Search" });

export class ExternalSearchManager {
  /**
   * Searches for movies on TheMovieDB.
   * @param name - The name of the movie to search for.
   * @param year - The optional release year of the movie.
   * @returns A promise that resolves to the search results.
   */
  public static async searchMovies(name: string, year?: string) {
    try {
      return await metadataProvider.searchMovies(name, year ?? "");
    } catch (error) {
      externalSearchLogger.error(error, "Error searching movies on TheMovieDB");
      throw new ApiError(503, "External movie search service is unavailable.");
    }
  }

  /**
   * Searches for TV shows on TheMovieDB.
   * @param name - The name of the TV show to search for.
   * @param year - The optional first air year of the show.
   * @returns A promise that resolves to the search results.
   */
  public static async searchTvShows(name: string, year?: string) {
    try {
      return await metadataProvider.searchTVShows(name, year ?? "");
    } catch (error) {
      externalSearchLogger.error(
        error,
        "Error searching TV shows on TheMovieDB"
      );
      throw new ApiError(
        503,
        "External TV show search service is unavailable."
      );
    }
  }

  /**
   * Searches for episode groups for a given series ID on TheMovieDB.
   * @param seriesId - The ID of the series.
   * @returns A promise that resolves to the episode group data.
   */
  public static async searchEpisodeGroups(seriesId: string) {
    try {
      return await metadataProvider.searchEpisodeGroups(seriesId);
    } catch (error) {
      externalSearchLogger.error(
        error,
        "Error searching episode groups on TheMovieDB"
      );
      throw new ApiError(
        503,
        "External episode group search service is unavailable."
      );
    }
  }

  /**
   * Gets the score for a given IMDB ID.
   * @param imdbId - The IMDB ID (e.g., 'tt0111161').
   * @returns A promise that resolves to the score data.
   */
  public static async getImdbScore(imdbId: string) {
    try {
      return await imdbScoreService.getIMDBScore(imdbId);
    } catch (error) {
      externalSearchLogger.error(error, "Error fetching IMDB score");
      throw new ApiError(503, "External IMDB score service is unavailable.");
    }
  }

  /**
   * Searches for downloadable video content.
   * @param query - The search query.
   * @returns A promise that resolves to the search results.
   */
  public static async searchDownloadableMedia(query: string) {
    try {
      return await DownloaderManager.searchVideos(query, 20);
    } catch (error) {
      externalSearchLogger.error(
        error,
        "Error searching for downloadable media"
      );
      throw new ApiError(500, "Failed to search for downloadable media.");
    }
  }
}
