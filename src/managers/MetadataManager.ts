import { Collection } from "@/api/v0/collections/collections.model";
import { Episode as EpisodeLocal } from "@/api/v0/episodes/episodes.model";
import { Movie } from "@/api/v0/movies/movies.model";
import { Season } from "@/api/v0/seasons/seasons.model";
import { Series } from "@/api/v0/series/series.model";
import { Video } from "@/api/v0/videos/videos.model";
import { MovieDBWrapper } from "@/theMovieDB/MovieDB";
import { getIMDBScore } from "@/utils/getIMDBScore";
import fs from "fs";
import { Episode, MovieResponse } from "moviedb-promise";
import { FilesManager } from "./FilesManager";

export class MetadataManager {
  static BASE_URL: string = "https://image.tmdb.org/t/p/original";

  //#region SERIES METADATA
  /**
   * Updates the metadata of a series using data from TMDb.
   * Does not update fields that are locked.
   * @param series The instance of the series to update.
   * @param language The language to obtain the metadata in.
   */
  public static async updateSeriesMetadata(
    series: Series,
    language: string
  ): Promise<Series | undefined> {
    if (series.themdbId === -1) return;

    const showData = await MovieDBWrapper.getTVShow(series.themdbId, language);
    if (!showData) return;

    // Update metadata if not blocked
    if (!series.nameLock) series.name = showData.name ?? "";
    if (!series.yearLock) series.year = showData.first_air_date ?? "";
    if (!series.overviewLock) series.overview = showData.overview ?? "";
    if (!series.taglineLock) series.tagline = showData.tagline ?? "";

    series.score = showData.vote_average
      ? (showData.vote_average * 10.0) / 10.0
      : 0;

    if (!series.productionStudiosLock) {
      series.productionStudios =
        showData.production_companies?.map((company) => company.name ?? "") ??
        [];
    }
    if (!series.genresLock) {
      series.genres = showData.genres?.map((genre) => genre.name ?? "") ?? [];
    }

    // Update crew and credits
    await this.updateSeriesCredits(series, language);

    // Download logos and posters
    await this.downloadSeriesImages(series);

    await series.save();
    return series;
  }

  /**
   * Update credits (cast and crew) of a series.
   * @param series instance of the series.
   */
  private static async updateSeriesCredits(series: Series, language: string) {
    const credits = await MovieDBWrapper.getTVCredits(series.themdbId);
    if (!credits) return;

    // Cast
    if (credits.cast) {
      series.cast = credits.cast.map((person) => ({
        name: person.name ?? "",
        character: person.character ?? "",
        profileImage: person.profile_path
          ? `${this.BASE_URL}${person.profile_path}`
          : "",
      }));
    }

    // Crew
    if (credits.crew) {
      if (!series.creatorLock) {
        series.creator = credits.crew
          .filter(
            (p) =>
              p.job &&
              [
                "Author",
                "Novel",
                "Original Story",
                "Story by",
                "Original Series Creator",
                "Comic Book",
                "Idea",
                "Story",
                "Book",
                "Original Concept",
              ].includes(p.job)
          )
          .map((p) => p.name ?? "");

        // Default creator
        if (series.creator && series.creator.length === 0) {
          const showData = await MovieDBWrapper.getTVShow(
            series.themdbId,
            language
          );
          series.creator = showData?.created_by?.map((p) => p.name ?? "") ?? [];
        }
      }
      if (!series.musicComposerLock) {
        series.musicComposer = credits.crew
          .filter((p) => p.job === "Original Music Composer")
          .map((p) => p.name ?? "");
      }
    }
  }

  /**
   * Download logos and posters of a series.
   * @param series instance of the series.
   */
  private static async downloadSeriesImages(series: Series) {
    // Create folders if they do not exist
    const outputLogosDir = FilesManager.getExternalPath(
      "resources/img/logos/" + series.id
    );
    if (!fs.existsSync(outputLogosDir)) {
      fs.mkdirSync(outputLogosDir);
    }

    const outputPostersDir = FilesManager.getExternalPath(
      "resources/img/posters/" + series.id
    );
    if (!fs.existsSync(outputPostersDir)) {
      fs.mkdirSync(outputPostersDir);
    }

    try {
      const images = await MovieDBWrapper.getTVShowImages(series.themdbId);
      if (!images) return;

      // Download logos
      if (images.logos && images.logos.length > 0) {
        series.logosUrls = images.logos.map(
          (logo) => `${this.BASE_URL}${logo.file_path}`
        );
        series.logoSrc = series.logosUrls[0];
      }

      // Download posters
      if (images.posters && images.posters.length > 0) {
        series.coversUrls = images.posters.map(
          (poster) => `${this.BASE_URL}${poster.file_path}`
        );
        series.coverSrc = series.coversUrls[0];
      }
    } catch (error) {
      console.error(`Error downloading images for series ${series.id}:`, error);
    }
  }

  /**
   * Update season metadata (backgrounds).
   * @param season instance of the season.
   * @param series instance of the series.
   */
  public static async updateSeasonMetadata(
    season: Season,
    series: Series
  ): Promise<Season> {
    // Create folders if they do not exist
    const outputImageDir = FilesManager.getExternalPath(
      "resources/img/backgrounds/" + season.id
    );
    if (!fs.existsSync(outputImageDir)) {
      fs.mkdirSync(outputImageDir);
    }

    // If there is another season with background, use its background instead of downloading another one
    if (series.seasons && series.seasons.length > 1) {
      for (let i = 0; i < series.seasons.length; i++) {
        const s = series.seasons[i];
        if (s.backgroundSrc.length > 0) {
          season.backgroundSrc = s.backgroundSrc;
          season.backgroundsUrls = s.backgroundsUrls;

          await season.save();
          return season;
        }
      }
    }

    try {
      const images = await MovieDBWrapper.getTVShowImages(series.themdbId);
      const backdrops = images?.backdrops ?? [];

      if (backdrops.length > 0) {
        season.backgroundsUrls = backdrops.map(
          (bg) => `${this.BASE_URL}${bg.file_path}`
        );
        season.backgroundSrc = season.backgroundsUrls[0];
      }
      await season.save();
    } catch (error) {
      console.error(
        `Error updating backgrounds for season ${season.id}:`,
        error
      );
    }

    return season;
  }

  /**
   * Updates the metadata of an episode, including images and credits.
   * @param episode The local episode instance to update.
   * @param video The video instance associated with the episode.
   * @param series The series to which the episode belongs.
   * @param episodeMetadata The metadata obtained from TMDb.
   */
  public static async updateEpisodeMetadata(
    episode: EpisodeLocal,
    video: Video,
    series: Series,
    episodeMetadata: Episode
  ): Promise<void> {
    // Update basic metadata
    episode.name = episodeMetadata.name ?? "";
    episode.overview = episodeMetadata.overview ?? "";
    episode.year = episodeMetadata.air_date ?? "";
    episode.score = episodeMetadata.vote_average
      ? (episodeMetadata.vote_average * 10.0) / 10.0
      : 0;
    video.runtime = episodeMetadata.runtime ?? 0;

    // Update cast and crew
    if (episodeMetadata.crew) {
      if (!episode.directedByLock) {
        episode.directedBy = episodeMetadata.crew
          .filter((p) => p.job === "Director")
          .map((p) => p.name ?? "");
      }
      if (!episode.writtenByLock) {
        episode.writtenBy = episodeMetadata.crew
          .filter((p) => p.job === "Writer")
          .map((p) => p.name ?? "");
      }
    }

    // Update images
    const images = await MovieDBWrapper.getEpisodeImages(
      series.themdbId,
      episode.seasonNumber,
      episode.episodeNumber
    );
    if (images?.stills) {
      video.imgUrls = images.stills.map(
        (img) => `${this.BASE_URL}${img.file_path}`
      );
    }
    video.imgSrc = episodeMetadata.still_path
      ? `${this.BASE_URL}${episodeMetadata.still_path}`
      : "";

    await episode.save();
    await video.save();
  }
  //#endregion

  //#region MOVIES METADATA
  /**
   * Updates the metadata of a movie, including credits and images.
   * @param movie The movie instance to update.
   * @param movieMetadata The metadata from TMDb.
   * @param collection (Optional) The collection to update the poster for.
   */
  public static async updateMovieMetadata(
    movie: Movie,
    movieMetadata: MovieResponse,
    language: string,
    collection?: Collection
  ): Promise<void> {
    if (!movie.nameLock) movie.name = movieMetadata.title ?? "";
    if (!movie.yearLock) movie.year = movieMetadata.release_date ?? "";
    if (!movie.overviewLock) movie.overview = movieMetadata.overview ?? "";
    if (!movie.taglineLock) movie.tagline = movieMetadata.tagline ?? "";

    movie.themdbId = movieMetadata.id ?? -1;
    movie.imdbId = movieMetadata.imdb_id ?? "-1";
    movie.score = movieMetadata.vote_average
      ? (movieMetadata.vote_average * 10) / 10
      : 0;

    if (!movie.genresLock) {
      movie.genres =
        movieMetadata.genres?.map((genre) => genre.name ?? "") ?? [];
    }
    if (!movie.productionStudiosLock) {
      movie.productionStudios =
        movieMetadata.production_companies?.map(
          (company) => company.name ?? ""
        ) ?? [];
    }

    // Get IMDB Score
    movie.imdbScore = await getIMDBScore(movie.imdbId);

    // Update cast and crew
    await this.updateMovieCredits(movie, movieMetadata.id ?? 0, language);

    // Download images (logos, backgrounds and posters)
    await this.downloadMovieImages(movie, collection);

    await movie.save();
    if (collection) {
      await collection.save();
    }
  }

  /**
   * Updates the credits (cast and crew) of a movie.
   * @param movie The movie instance to update.
   * @param themdbId The TMDb ID of the movie.
   */
  private static async updateMovieCredits(
    movie: Movie,
    themdbId: number,
    language: string
  ) {
    const credits = await MovieDBWrapper.getMovieCredits(themdbId, language);
    if (!credits) return;

    if (credits.crew) {
      if (!movie.directedByLock && movie.directedBy) {
        movie.directedBy.splice(0, movie.directedBy.length);
        for (const person of credits.crew) {
          if (person.name && person.job === "Director" && movie.directedBy)
            movie.directedBy = [...movie.directedBy, person.name];
        }
      }

      if (!movie.writtenByLock && movie.writtenBy) {
        movie.writtenBy.splice(0, movie.writtenBy.length);
        for (const person of credits.crew) {
          if (
            person.name &&
            (person.job === "Writer" || person.job === "Novel") &&
            movie.writtenBy
          )
            movie.writtenBy = [...movie.writtenBy, person.name];
        }
      }

      if (!movie.creatorLock && movie.creator && movie.creator.length > 0)
        movie.creator.splice(0, movie.creator.length);

      if (
        !movie.musicComposerLock &&
        movie.musicComposer &&
        movie.musicComposer.length > 0
      )
        movie.musicComposer.splice(0, movie.musicComposer.length);

      for (const person of credits.crew) {
        if (
          !movie.creatorLock &&
          person.job &&
          (person.job === "Author" ||
            person.job === "Novel" ||
            person.job === "Original Series Creator" ||
            person.job === "Comic Book" ||
            person.job === "Idea" ||
            person.job === "Original Story" ||
            person.job === "Story" ||
            person.job === "Story by" ||
            person.job === "Book" ||
            person.job === "Original Concept")
        )
          if (person.name && !movie.creatorLock && movie.creator)
            movie.creator = [...movie.creator, person.name];

        if (
          !movie.musicComposerLock &&
          person.job &&
          person.job === "Original Music Composer"
        )
          if (person.name && !movie.musicComposerLock && movie.musicComposer)
            movie.musicComposer = [...movie.musicComposer, person.name];
      }
    }

    if (credits.cast) {
      movie.cast = credits.cast.map((person) => ({
        name: person.name ?? "",
        character: person.character ?? "",
        profileImage: person.profile_path
          ? `${this.BASE_URL}${person.profile_path}`
          : "",
      }));
    }
  }

  /**
   * Downloads and assigns logos, posters and backgrounds for a movie.
   * @param movie The movie to which the images will be assigned.
   * @param collection (Optional) The collection to which the posters will also be assigned.
   */
  private static async downloadMovieImages(
    movie: Movie,
    collection?: Collection
  ) {
    try {
      const images = await MovieDBWrapper.getMovieImages(movie.themdbId);
      if (!images) return;

      // Create folders if they do not exist
      const outputLogosDir = FilesManager.getExternalPath(
        "resources/img/logos/" + movie.id
      );
      if (!fs.existsSync(outputLogosDir)) {
        fs.mkdirSync(outputLogosDir);
      }

      const outputPostersDir = FilesManager.getExternalPath(
        "resources/img/posters/" + movie.id
      );
      if (!fs.existsSync(outputPostersDir)) {
        fs.mkdirSync(outputPostersDir);
      }

      const outputPostersCollectionDir = FilesManager.getExternalPath(
        "resources/img/posters/" + collection?.id
      );

      if (collection) {
        if (!fs.existsSync(outputPostersCollectionDir)) {
          fs.mkdirSync(outputPostersCollectionDir);
        }
      }

      const outputImageDir = FilesManager.getExternalPath(
        "resources/img/backgrounds/" + movie.id
      );
      if (!fs.existsSync(outputImageDir)) {
        fs.mkdirSync(outputImageDir);
      }

      // Backdrops
      if (images.backdrops && images.backdrops.length > 0) {
        movie.backgroundsUrls = images.backdrops.map(
          (img) => `${this.BASE_URL}${img.file_path}`
        );
        movie.backgroundSrc = movie.backgroundsUrls[0];
      }

      // Logos
      if (images.logos && images.logos.length > 0) {
        movie.logosUrls = images.logos.map(
          (img) => `${this.BASE_URL}${img.file_path}`
        );
        movie.logoSrc = movie.logosUrls[0];
      }

      // Posters
      if (images.posters && images.posters.length > 0) {
        movie.coversUrls = images.posters.map(
          (img) => `${this.BASE_URL}${img.file_path}`
        );
        movie.coverSrc = movie.coversUrls[0];

        // If there is a collection, add poster to collection
        if (collection) {
          collection.postersUrls.push(movie.coversUrls[0]);
          if (!collection.posterSrc) {
            collection.posterSrc = movie.coversUrls[0];
          }

          await collection.save();
        }
      }

      await movie.save();
    } catch (error) {
      console.error(
        `Error descargando imágenes para la película ${movie.id}:`,
        error
      );
    }
  }

  /**
   * Updates the metadata of a Video object, specifically its thumbnails.
   * @param video The video to update.
   * @param movie The movie to which the video belongs.
   */
  public static async updateVideoMetadataForMovie(
    video: Video,
    movie: Movie
  ): Promise<void> {
    try {
      const images = await MovieDBWrapper.getMovieImages(movie.themdbId);
      const thumbnails = images?.backdrops ?? [];

      // Initialize thumbnails path
      const outputDir = FilesManager.getExternalPath(
        "resources/img/thumbnails/video/" + video.id + "/"
      );
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      if (thumbnails.length > 0) {
        video.imgUrls = thumbnails.map(
          (thumb) => `${this.BASE_URL}${thumb.file_path}`
        );
        video.imgSrc = video.imgUrls[0];
      } else {
        video.imgSrc = "resources/img/Default_video_thumbnail.jpg";
      }

      await video.save();
    } catch (error) {
      console.error(
        `Error actualizando miniaturas para el video ${video.id}:`,
        error
      );
    }
  }
  //#endregion
}
