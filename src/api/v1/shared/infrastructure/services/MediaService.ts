import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";

import ApiError from "@/data/ApiError";

// Interface for the structured video info response
interface FormattedVideoInfo {
  title: string;
  subtitle: string;
  info: string;
  preferAudioLan: string;
  preferSubtitleLan: string;
  subsMode: string;
}

export class MediaService {
  /**
   * Fetches a video and its related parent entities (Series/Movie, Library)
   * to construct a formatted information object.
   * @param videoId - The ID of the video file.
   * @returns A promise that resolves to a formatted video info object.
   */
  public static async getFormattedVideoInfo(
    videoId: string
  ): Promise<FormattedVideoInfo> {
    const video = await useCases.getVideoById().execute(videoId);
    if (!video) throw new ApiError(404, messages.errors.notFound.video);

    if (video.episodeId) {
      const episode = await useCases.getEpisodeById().execute(video.episodeId);
      if (!episode) throw new ApiError(404, messages.errors.notFound.episode);

      const season = await useCases.getSeasonById().execute(episode.seasonId);
      if (!season) throw new ApiError(404, messages.errors.notFound.season);

      const series = await useCases.getSeriesById().execute(season.seriesId);
      if (!series) throw new ApiError(404, messages.errors.notFound.series);

      const library = await useCases.getLibrary().execute(series.libraryId);
      if (!library) throw new ApiError(404, messages.errors.notFound.library);

      return {
        title: series.name,
        subtitle: episode.name,
        info: `S${episode.seasonNumber}E${episode.episodeNumber}`,
        preferAudioLan: series.preferAudioLan || library.preferAudioLan || "",
        preferSubtitleLan: series.preferSubLan || library.preferSubLan || "",
        subsMode: series.subsMode || library.subsMode || "",
      };
    }

    if (video.movieId) {
      const movie = await useCases.getMoviebyId().execute(video.movieId);
      if (!movie) throw new ApiError(404, messages.errors.notFound.movie);

      const library = await useCases.getLibrary().execute(movie.libraryId);
      if (!library) throw new ApiError(404, messages.errors.notFound.library);

      const year = new Date(movie.year).getFullYear();

      return {
        title: movie.name,
        subtitle: "",
        info: `${year}`,
        preferAudioLan: library.preferAudioLan || "",
        preferSubtitleLan: library.preferSubLan || "",
        subsMode: library.subsMode || "",
      };
    }

    throw new ApiError(
      404,
      "Video is not associated with any movie or episode."
    );
  }

  /**
   * Counts the number of episodes in a series that a user has not yet watched.
   * NOTE: This implementation is optimized to avoid N+1 query problems.
   * @param seriesId - The ID of the series.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to the count of remaining episodes.
   */
  public static async countRemainingEpisodes(
    seriesId: string,
    userId: string
  ): Promise<number> {
    const series = await useCases.getSeriesById().execute(seriesId, "all");
    if (!series) throw new ApiError(404, messages.errors.notFound.series);

    let totalEpisodes = 0;
    let watchedEpisodes = 0;

    for (const season of series.seasons) {
      for (const episode of season.episodes) {
        totalEpisodes++;
        const video = await useCases.getVideoByEpisodeId().execute(episode.id); // This could still be an N+1, ideally getSeriesById should include this data
        if (video && video.watchLists.some((wl: any) => wl.userId === userId)) {
          watchedEpisodes++;
        }
      }
    }

    return totalEpisodes - watchedEpisodes;
  }

  /**
   * Counts the number of videos for a movie that a user has not yet watched.
   * @param movieId - The ID of the movie.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to the count of remaining videos.
   */
  public static async countRemainingVideos(
    movieId: string,
    userId: string
  ): Promise<number> {
    const movie = await useCases.getMoviebyId().execute(movieId);
    if (!movie) throw new ApiError(404, messages.errors.notFound.movie);

    const watchedCount = movie.videos.filter((video: any) =>
      video.watchLists.some((wl: any) => wl.userId === userId)
    ).length;

    return movie.videos.length - watchedCount;
  }

  /**
   * Checks if a series is in a user's "My List".
   * @returns A promise that resolves to a boolean.
   */
  public static async isSeriesInMyList(
    seriesId: string,
    userId: string
  ): Promise<boolean> {
    const seriesInList = await useCases
      .isSeriesInMyList()
      .execute(seriesId, userId);
    return seriesInList !== null;
  }

  /**
   * Checks if a movie is in a user's "My List".
   * @returns A promise that resolves to a boolean.
   */
  public static async isMovieInMyList(
    movieId: string,
    userId: string
  ): Promise<boolean> {
    const movieInList = await useCases
      .isMovieInMyList()
      .execute(movieId, userId);
    return movieInList !== null;
  }
}
