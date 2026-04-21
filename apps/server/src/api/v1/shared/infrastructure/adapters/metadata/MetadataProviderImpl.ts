import fs from 'node:fs';
import type { Video } from '@seerial/domain';
import type {
  CreditsResponse,
  Episode,
  EpisodeGroupResponse,
  EpisodeImagesResponse,
  MovieImagesResponse,
  MovieResponse,
  MovieResult,
  ShowResponse,
  TvEpisodeGroupsResponse,
  TvImagesResponse,
  TvResult,
  TvSeasonImagesResponse,
  TvSeasonResponse,
} from 'moviedb-promise';
import type { Collection } from '@/api/v1/collections/domain/Collection';
import type { Episode as EpisodeData } from '@/api/v1/episodes/domain/Episode';
import type { Movie } from '@/api/v1/movies/domain/Movie';
import type { Season } from '@/api/v1/seasons/domain/Season';
import type { Series } from '@/api/v1/series/domain/Series';
import logger from '@/utils/logger';
import type { MetadataProviderPort } from '../../../application/ports/MetadataProviderPort';
import { fileSystemService, imdbScoreService, metadataProvider, useCases } from '../di/container';
import type { TMDbApiClient } from './TMDbApiClient';

const metadataLogger = logger.child({ category: 'Metadata' });
const metadataManagerLogger = logger.child({ category: 'Metadata Manager' });

export class MetadataProviderImpl implements MetadataProviderPort {
  constructor(private readonly apiClient: TMDbApiClient) {}

  private readonly BASE_URL: string = 'https://image.tmdb.org/t/p/original';

  //#region SEARCH
  public async searchMovies(name: string, year: string): Promise<MovieResult[]> {
    try {
      // Prepare query parameters
      const queryParams = {
        query: name.trim(),
        year: year.trim(),
        include_adult: false,
      };

      // Make API request
      const data = await this.apiClient.makeRequest('search/movie', queryParams);

      if (!data) {
        return [];
      }

      // Verify that the results array exists
      if (!Array.isArray(data.results)) {
        metadataLogger.error('The response does not contain a valid results array');
        return [];
      }

      return data.results as MovieResult[];
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in searchMovies');
      } else {
        metadataLogger.error({ error }, 'Unknown error in searchMovies');
      }
      return [];
    }
  }

  public async searchTVShows(name: string, year: string): Promise<TvResult[]> {
    try {
      // Prepare query parameters
      const queryParams = {
        query: name.trim(),
        first_air_date_year: year.trim(),
        include_adult: false,
      };

      // Make API request
      const data = await this.apiClient.makeRequest('search/tv', queryParams);

      if (!data) {
        return [];
      }

      // Verify that the results array exists
      if (!Array.isArray(data.results)) {
        metadataLogger.error('The response does not contain a valid results array');
        return [];
      }

      return data.results as TvResult[];
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in searchTVShows');
      } else {
        metadataLogger.error({ error }, 'Unknown error in searchTVShows');
      }
      return [];
    }
  }

  public async searchEpisodeGroups(id: string): Promise<TvEpisodeGroupsResponse | null> {
    try {
      const queryParams = {};
      const data = await this.apiClient.makeRequest(`tv/${id}/episode_groups`, queryParams);

      if (!data || !Array.isArray(data.results)) {
        metadataLogger.error('The response does not contain a valid results array');
        return null;
      }

      return data.results as TvEpisodeGroupsResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in searchEpisodeGroups');
      } else {
        metadataLogger.error({ error }, 'Unknown error in searchEpisodeGroups');
      }
      return null;
    }
  }
  //#endregion

  //#region GET DATA
  public async getMovie(id: number, language: string): Promise<MovieResponse | null> {
    if (id < 1) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.apiClient.makeRequest(`movie/${id}`, queryParams);

      if (!data) {
        metadataLogger.error('No data returned from API');
        return null;
      }

      return data as MovieResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getMovie');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getMovie');
      }
      return null;
    }
  }

  public async getTVShow(id: number, language: string): Promise<ShowResponse | null> {
    if (id < 1) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.apiClient.makeRequest(`tv/${id}`, queryParams);

      if (!data) {
        metadataLogger.error('No data returned from API');
        return null;
      }

      return data as ShowResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getTVShow');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getTVShow');
      }
      return null;
    }
  }

  public async getSeason(
    showID: number,
    seasonNumber: number,
    language: string,
  ): Promise<TvSeasonResponse | null> {
    if (showID < 1 || seasonNumber < 0) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.apiClient.makeRequest(
        `tv/${showID}/season/${seasonNumber}`,
        queryParams,
      );

      if (!data) {
        metadataLogger.error('No data returned from API');
        return null;
      }

      return data as TvSeasonResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getSeason');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getSeason');
      }
      return null;
    }
  }
  //#endregion

  //#region EPISODE GROUPS
  public async getEpisodeGroups(showID: number): Promise<EpisodeGroupResponse[] | null> {
    if (showID < 1) return null;

    try {
      const queryParams = {};
      const data = await this.apiClient.makeRequest(`tv/${showID}/episode_groups`, queryParams);

      if (!data || !Array.isArray(data.results)) {
        metadataLogger.error('The response does not contain a valid results array');
        return null;
      }

      return data.results as EpisodeGroupResponse[];
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getEpisodeGroups');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getEpisodeGroups');
      }
      return null;
    }
  }

  public async getEpisodeGroup(id: string): Promise<EpisodeGroupResponse | undefined> {
    if (!id) return undefined;

    try {
      const queryParams = {};
      const data = await this.apiClient.makeRequest(`tv/episode_group/${id}`, queryParams);

      if (!data) {
        metadataLogger.error('No data returned from API');
        return undefined;
      }

      return data as EpisodeGroupResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getEpisodeGroup');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getEpisodeGroup');
      }
      return undefined;
    }
  }
  //#endregion

  //#region CREDITS
  public async getMovieCredits(movieID: number, language: string): Promise<CreditsResponse | null> {
    if (movieID < 1) return null;

    try {
      const queryParams = { language: language.trim() };
      const data = await this.apiClient.makeRequest(`movie/${movieID}/credits`, queryParams);

      if (!data || !Array.isArray(data.cast) || !Array.isArray(data.crew)) {
        metadataLogger.error('The response does not contain valid credits data');
        return null;
      }

      return data as CreditsResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getMovieCredits');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getMovieCredits');
      }
      return null;
    }
  }
  public async getTVCredits(showID: number): Promise<CreditsResponse | null> {
    if (showID < 1) return null;

    try {
      const queryParams = {};
      const data = await this.apiClient.makeRequest(`tv/${showID}/credits`, queryParams);

      if (!data || !Array.isArray(data.cast) || !Array.isArray(data.crew)) {
        metadataLogger.error('The response does not contain valid credits data');
        return null;
      }

      return data as CreditsResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getTVCredits');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getTVCredits');
      }
      return null;
    }
  }
  //#endregion

  //#region IMAGES
  public async getMovieImages(movieID: number): Promise<MovieImagesResponse | null> {
    if (movieID < 1) return null;

    try {
      const queryParams = {
        include_image_language: 'es,en,null,ja',
      };
      const data = await this.apiClient.makeRequest(`movie/${movieID}/images`, queryParams);

      if (!data || !Array.isArray(data.backdrops) || !Array.isArray(data.posters)) {
        metadataLogger.error('The response does not contain valid images data');
        return null;
      }

      return data as MovieImagesResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getMovieImages');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getMovieImages');
      }
      return null;
    }
  }
  public async getTVShowImages(showID: number): Promise<TvImagesResponse | null> {
    if (showID < 1) return null;

    try {
      const queryParams = {
        include_image_language: 'es,en,null,ja',
      };
      const data = await this.apiClient.makeRequest(`tv/${showID}/images`, queryParams);

      if (!data || !Array.isArray(data.backdrops) || !Array.isArray(data.posters)) {
        metadataLogger.error('The response does not contain valid images data');
        return null;
      }

      return data as TvImagesResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getTVShowImages');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getTVShowImages');
      }
      return null;
    }
  }
  public async getSeasonImages(
    showID: number,
    seasonNumber: number,
  ): Promise<TvSeasonImagesResponse | null> {
    if (showID < 1 || seasonNumber < 0) return null;

    try {
      const queryParams = {
        include_image_language: 'es,en,null,ja',
      };
      const data = await this.apiClient.makeRequest(
        `tv/${showID}/season/${seasonNumber}/images`,
        queryParams,
      );

      if (!data || !Array.isArray(data.posters)) {
        metadataLogger.error('The response does not contain valid images data');
        return null;
      }

      return data as TvSeasonImagesResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getSeasonImages');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getSeasonImages');
      }
      return null;
    }
  }
  public async getEpisodeImages(
    showID: number,
    seasonNumber: number,
    episodeNumber: number,
  ): Promise<EpisodeImagesResponse | null> {
    if (showID < 1 || seasonNumber < 0 || episodeNumber < 1) return null;

    try {
      const queryParams = {
        include_image_language: 'es,en,null,ja',
      };
      const data = await this.apiClient.makeRequest(
        `tv/${showID}/season/${seasonNumber}/episode/${episodeNumber}/images`,
        queryParams,
      );

      if (!data || !Array.isArray(data.stills)) {
        metadataLogger.error('The response does not contain valid images data');
        return null;
      }

      return data as EpisodeImagesResponse;
    } catch (error: unknown) {
      if (error instanceof Error) {
        metadataLogger.error(error, 'Error in getEpisodeImages');
      } else {
        metadataLogger.error({ error }, 'Unknown error in getEpisodeImages');
      }
      return null;
    }
  }
  //#endregion

  //#region SERIES METADATA
  /**
   * Updates the metadata of a series using data from TMDb.
   * Does not update fields that are locked.
   * @param series The instance of the series to update.
   * @param language The language to obtain the metadata in.
   */
  public async updateSeriesMetadata(series: Series, language: string): Promise<Series | undefined> {
    if (series.themdbId === -1) return;

    const showData = await metadataProvider.getTVShow(series.themdbId, language);
    if (!showData) return;

    // Update metadata if not blocked
    if (!series.nameLock) series.name = showData.name ?? '';
    if (!series.yearLock) series.year = showData.first_air_date ?? '';
    if (!series.overviewLock) series.overview = showData.overview ?? '';
    if (!series.taglineLock) series.tagline = showData.tagline ?? '';

    series.score = showData.vote_average ? (showData.vote_average * 10.0) / 10.0 : 0;

    if (!series.productionStudiosLock) {
      series.productionStudios =
        showData.production_companies?.map((company) => company.name ?? '') ?? [];
    }
    if (!series.genresLock) {
      series.genres = showData.genres?.map((genre) => genre.name ?? '') ?? [];
    }

    // Update crew and credits
    await this.updateSeriesCredits(series, language);

    // Download logos and posters
    await this.downloadSeriesImages(series);

    await useCases.updateSeries().execute(series.id, series);
    return series;
  }

  /**
   * Update credits (cast and crew) of a series.
   * @param series instance of the series.
   */
  private async updateSeriesCredits(series: Series, language: string) {
    const credits = await metadataProvider.getTVCredits(series.themdbId);
    if (!credits) return;

    // Cast
    if (credits.cast) {
      series.cast = credits.cast.map((person) => ({
        name: person.name ?? '',
        character: person.character ?? '',
        profileImage: person.profile_path ? `${this.BASE_URL}${person.profile_path}` : '',
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
                'Author',
                'Novel',
                'Original Story',
                'Story by',
                'Original Series Creator',
                'Comic Book',
                'Idea',
                'Story',
                'Book',
                'Original Concept',
              ].includes(p.job),
          )
          .map((p) => p.name ?? '');

        // Default creator
        if (series.creator && series.creator.length === 0) {
          const showData = await metadataProvider.getTVShow(series.themdbId, language);
          series.creator = showData?.created_by?.map((p) => p.name ?? '') ?? [];
        }
      }
      if (!series.musicComposerLock) {
        series.musicComposer = credits.crew
          .filter((p) => p.job === 'Original Music Composer')
          .map((p) => p.name ?? '');
      }
    }
  }

  /**
   * Update season metadata (backgrounds).
   * @param season instance of the season.
   * @param series instance of the series.
   */
  public async updateSeasonMetadata(season: Season, series: Series): Promise<Season> {
    // Create folders if they do not exist
    const outputImageDir = fileSystemService.getExternalPath(
      `resources/img/backgrounds/${season.id}`,
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

          await useCases.updateSeason().execute(season.id, season);
          return season;
        }
      }
    }

    try {
      const images = await metadataProvider.getTVShowImages(series.themdbId);
      const backdrops = images?.backdrops ?? [];

      if (backdrops.length > 0) {
        season.backgroundsUrls = backdrops.map((bg) => `${this.BASE_URL}${bg.file_path}`);
        season.backgroundSrc = season.backgroundsUrls[0];
      }
      await useCases.updateSeason().execute(season.id, season);
    } catch (error) {
      metadataManagerLogger.error(error, `Error updating backgrounds for season ${season.id}`);
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
  public async updateEpisodeMetadata(
    episode: EpisodeData,
    video: Video,
    series: Series,
    episodeMetadata: Episode,
  ): Promise<void> {
    // Update basic metadata
    episode.name = episodeMetadata.name ?? '';
    episode.overview = episodeMetadata.overview ?? '';
    episode.year = episodeMetadata.air_date ?? '';
    episode.score = episodeMetadata.vote_average ? (episodeMetadata.vote_average * 10.0) / 10.0 : 0;
    video.runtime = episodeMetadata.runtime ?? 0;

    // Update cast and crew
    if (episodeMetadata.crew) {
      if (!episode.directedByLock) {
        episode.directedBy = episodeMetadata.crew
          .filter((p) => p.job === 'Director')
          .map((p) => p.name ?? '');
      }
      if (!episode.writtenByLock) {
        episode.writtenBy = episodeMetadata.crew
          .filter((p) => p.job === 'Writer')
          .map((p) => p.name ?? '');
      }
    }

    // Update images
    const images = await metadataProvider.getEpisodeImages(
      series.themdbId,
      episodeMetadata.season_number ?? episode.seasonNumber,
      episodeMetadata.episode_number ?? episode.episodeNumber,
    );
    if (images?.stills) {
      video.imgUrls = images.stills.map((img) => `${this.BASE_URL}${img.file_path}`);
    }
    video.imgSrc = episodeMetadata.still_path
      ? `${this.BASE_URL}${episodeMetadata.still_path}`
      : '';

    await useCases.updateEpisode().execute(episode.id, episode);
    await useCases.updateVideo().execute(video.id, video);
  }
  //#endregion

  //#region MOVIES METADATA
  /**
   * Updates the metadata of a movie, including credits and images.
   * @param movie The movie instance to update.
   * @param movieMetadata The metadata from TMDb.
   * @param collection (Optional) The collection to update the poster for.
   */
  public async updateMovieMetadata(
    movie: Movie,
    movieMetadata: MovieResponse,
    language: string,
    collection?: Collection,
  ): Promise<void> {
    if (!movie.nameLock) movie.name = movieMetadata.title ?? '';
    if (!movie.yearLock) movie.year = movieMetadata.release_date ?? '';
    if (!movie.overviewLock) movie.overview = movieMetadata.overview ?? '';
    if (!movie.taglineLock) movie.tagline = movieMetadata.tagline ?? '';

    movie.themdbId = movieMetadata.id ?? -1;
    movie.imdbId = movieMetadata.imdb_id ?? '-1';
    movie.score = movieMetadata.vote_average ? (movieMetadata.vote_average * 10) / 10 : 0;

    if (!movie.genresLock) {
      movie.genres = movieMetadata.genres?.map((genre) => genre.name ?? '') ?? [];
    }
    if (!movie.productionStudiosLock) {
      movie.productionStudios =
        movieMetadata.production_companies?.map((company) => company.name ?? '') ?? [];
    }

    // Get IMDB Score
    movie.imdbScore = await imdbScoreService.getIMDBScore(movie.imdbId);

    // Update cast and crew
    await this.updateMovieCredits(movie, movieMetadata.id ?? 0, language);

    // Download images (logos, backgrounds and posters)
    await this.downloadMovieImages(movie, collection);

    await useCases.updateMovie().execute(movie.id, movie);
    if (collection) {
      await useCases.updateCollection().execute(collection.id, collection);
    }
  }

  /**
   * Updates the credits (cast and crew) of a movie.
   * @param movie The movie instance to update.
   * @param themdbId The TMDb ID of the movie.
   */
  private async updateMovieCredits(movie: Movie, themdbId: number, language: string) {
    const credits = await metadataProvider.getMovieCredits(themdbId, language);
    if (!credits) return;

    this.updateMovieCrew(movie, credits.crew ?? []);

    if (credits.cast) {
      movie.cast = credits.cast.map((person) => ({
        name: person.name ?? '',
        character: person.character ?? '',
        profileImage: person.profile_path ? `${this.BASE_URL}${person.profile_path}` : '',
      }));
    }
  }

  /**
   * Updates the metadata of a Video object, specifically its thumbnails.
   * @param video The video to update.
   * @param movie The movie to which the video belongs.
   */
  public async updateVideoMetadataForMovie(video: Video, movie: Movie): Promise<void> {
    try {
      const images = await metadataProvider.getMovieImages(movie.themdbId);
      const thumbnails = images?.backdrops ?? [];

      // Initialize thumbnails path
      const outputDir = fileSystemService.getExternalPath(
        `resources/img/thumbnails/video/${video.id}/`,
      );
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }

      if (thumbnails.length > 0) {
        video.imgUrls = thumbnails.map((thumb) => `${this.BASE_URL}${thumb.file_path}`);
        video.imgSrc = video.imgUrls[0];
      } else {
        video.imgSrc = 'resources/img/Default_video_thumbnail.jpg';
      }

      await useCases.updateVideo().execute(video.id, video);
    } catch (error) {
      metadataManagerLogger.error(error, `Error actualizando miniaturas para el video ${video.id}`);
    }
  }
  //#endregion

  /**
   * Downloads and assigns logos, posters and backgrounds for a movie.
   * @param movie The movie to which the images will be assigned.
   * @param collection (Optional) The collection to which the posters will also be assigned.
   */
  private async downloadMovieImages(movie: Movie, collection?: Collection) {
    try {
      const images = await metadataProvider.getMovieImages(movie.themdbId);
      if (!images) return;

      this.ensureMovieImageDirectories(movie.id, collection?.id);
      this.assignMovieImageUrls(movie, images);
      await this.assignCollectionPoster(collection, movie);

      await useCases.updateMovie().execute(movie.id, movie);
    } catch (error) {
      metadataManagerLogger.error(error, `Error descargando imágenes para la película ${movie.id}`);
    }
  }

  private updateMovieCrew(movie: Movie, crew: Array<{ name?: string; job?: string }>): void {
    this.updateDirectedBy(movie, crew);
    this.updateWrittenBy(movie, crew);
    this.updateCreator(movie, crew);
    this.updateMusicComposer(movie, crew);
  }

  private updateDirectedBy(movie: Movie, crew: Array<{ name?: string; job?: string }>): void {
    if (movie.directedByLock || !movie.directedBy) return;
    movie.directedBy.splice(0, movie.directedBy.length);
    movie.directedBy = crew
      .filter((person) => person.name && person.job === 'Director')
      .map((person) => person.name as string);
  }

  private updateWrittenBy(movie: Movie, crew: Array<{ name?: string; job?: string }>): void {
    if (movie.writtenByLock || !movie.writtenBy) return;
    movie.writtenBy.splice(0, movie.writtenBy.length);
    movie.writtenBy = crew
      .filter((person) => person.name && (person.job === 'Writer' || person.job === 'Novel'))
      .map((person) => person.name as string);
  }

  private updateCreator(movie: Movie, crew: Array<{ name?: string; job?: string }>): void {
    if (movie.creatorLock || !movie.creator) return;

    const creatorJobs = new Set([
      'Author',
      'Novel',
      'Original Series Creator',
      'Comic Book',
      'Idea',
      'Original Story',
      'Story',
      'Story by',
      'Book',
      'Original Concept',
    ]);

    movie.creator.splice(0, movie.creator.length);
    movie.creator = crew
      .filter((person) => person.name && person.job && creatorJobs.has(person.job))
      .map((person) => person.name as string);
  }

  private updateMusicComposer(movie: Movie, crew: Array<{ name?: string; job?: string }>): void {
    if (movie.musicComposerLock || !movie.musicComposer) return;
    movie.musicComposer.splice(0, movie.musicComposer.length);
    movie.musicComposer = crew
      .filter((person) => person.name && person.job === 'Original Music Composer')
      .map((person) => person.name as string);
  }

  private ensureMovieImageDirectories(movieId: string, collectionId?: string): void {
    const dirs = [
      fileSystemService.getExternalPath(`resources/img/logos/${movieId}`),
      fileSystemService.getExternalPath(`resources/img/posters/${movieId}`),
      fileSystemService.getExternalPath(`resources/img/backgrounds/${movieId}`),
    ];

    if (collectionId) {
      dirs.push(fileSystemService.getExternalPath(`resources/img/posters/${collectionId}`));
    }

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
    }
  }

  private assignMovieImageUrls(
    movie: Movie,
    images: Awaited<ReturnType<typeof metadataProvider.getMovieImages>>,
  ): void {
    if (images?.backdrops && images.backdrops.length > 0) {
      movie.backgroundsUrls = images.backdrops.map((img) => `${this.BASE_URL}${img.file_path}`);
      movie.backgroundSrc = movie.backgroundsUrls[0];
    }

    if (images?.logos && images.logos.length > 0) {
      movie.logosUrls = images.logos.map((img) => `${this.BASE_URL}${img.file_path}`);
      movie.logoSrc = movie.logosUrls[0];
    }

    if (images?.posters && images.posters.length > 0) {
      movie.coversUrls = images.posters.map((img) => `${this.BASE_URL}${img.file_path}`);
      movie.coverSrc = movie.coversUrls[0];
    }
  }

  private async assignCollectionPoster(
    collection: Collection | undefined,
    movie: Movie,
  ): Promise<void> {
    if (!collection || !movie.coversUrls?.length) return;

    if (!collection.coversUrls) {
      collection.coversUrls = [];
    }
    collection.coversUrls.push(movie.coversUrls[0]);

    if (!collection.coverSrc) {
      collection.coverSrc = movie.coversUrls[0];
    }

    await useCases.updateCollection().execute(collection.id, collection);
  }

  /**
   * Download logos and posters of a series.
   * @param series instance of the series.
   */
  private async downloadSeriesImages(series: Series) {
    // Create folders if they do not exist
    const outputLogosDir = fileSystemService.getExternalPath(`resources/img/logos/${series.id}`);
    if (!fs.existsSync(outputLogosDir)) {
      fs.mkdirSync(outputLogosDir);
    }

    const outputPostersDir = fileSystemService.getExternalPath(
      `resources/img/posters/${series.id}`,
    );
    if (!fs.existsSync(outputPostersDir)) {
      fs.mkdirSync(outputPostersDir);
    }

    try {
      const images = await metadataProvider.getTVShowImages(series.themdbId);
      if (!images) return;

      // Download logos
      if (images.logos && images.logos.length > 0) {
        series.logosUrls = images.logos.map((logo) => `${this.BASE_URL}${logo.file_path}`);
        series.logoSrc = series.logosUrls[0];
      }

      // Download posters
      if (images.posters && images.posters.length > 0) {
        series.coversUrls = images.posters.map((poster) => `${this.BASE_URL}${poster.file_path}`);
        series.coverSrc = series.coversUrls[0];
      }
    } catch (error) {
      metadataManagerLogger.error(error, `Error downloading images for series ${series.id}`);
    }
  }
}
