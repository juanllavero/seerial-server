import type { DetailsData } from '@seerial/domain';
import { formatDate, type ItemType, type LibraryItem, LibraryTypes } from '@seerial/domain';
import { v4 as uuidv4 } from 'uuid';
import { AlbumModel } from '@/api/v1/albums/infrastructure/persistence/models/AlbumModel';
import { BaseRepository } from '@/api/v1/base-repository/BaseRepository';
import { CollectionModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionModel';
import { EpisodeModel } from '@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { SeasonModel } from '@/api/v1/seasons/infrastructure/persistence/models/SeasonModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { DatabaseManager } from '@/api/v1/shared/infrastructure/persistence/DatabaseManager';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { VideoModel } from '@/api/v1/videos/infrastructure/persistence/models/VideoModel';
import { messages } from '@/config/messages';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';
import logger from '@/utils/logger';
import type { LibrariesRepositoryPort } from '../../../application/ports/LibrariesRepositoryPort';
import { resolveCollectionImages } from '../../../application/services/LibraryManager';
import type { Library } from '../../../domain/Library';
import { LibraryCollectionModel } from '../models/LibraryCollectionModel';
import { LibraryModel } from '../models/LibraryModel';

const libraryRepositoryLogger = logger.child({
  category: 'Library Repository',
});

export class LibrariesRepositoryImpl extends BaseRepository implements LibrariesRepositoryPort {
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<LibraryModel, Library>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(LibraryModel, {
      entityName: 'Library',
      generateShortId: true,
    });
  }

  async getAll() {
    const libraries = await LibraryModel.find({
      order: { order: 'ASC' },
    });

    return libraries.map((library) => library as unknown as Library);
  }

  async getContent(libraryId: string, userId: string): Promise<LibraryItem[]> {
    const library = await LibraryModel.findOne({
      where: { id: libraryId },
      relations: [
        'series',
        'series.watchLists',
        'series.myLists',
        'series.seasons',
        'series.seasons.episodes',
        'series.seasons.episodes.watchLists',
        'movies',
        'movies.watchLists',
        'movies.myLists',
        'movies.videos',
        'albums',
        'libraryCollections',
        'libraryCollections.collection',
        'libraryCollections.collection.collectionMovies.movie',
        'libraryCollections.collection.collectionSeries.series',
        'libraryCollections.collection.collectionAlbums.album',
        'libraryCollections.collection.libraryCollections.library',
      ],
    });

    if (!library) return [];

    const collections =
      library.libraryCollections?.map((libraryCollection) => libraryCollection.collection) || [];
    const collectionItems = await this.buildCollectionItems(collections, libraryId, library.type);
    const standaloneItems = await this.buildStandaloneItems(library, collections, userId);

    return [...collectionItems, ...standaloneItems].sort((a, b) => a.order - b.order);
  }

  private async buildCollectionItems(
    collections: CollectionModel[],
    libraryId: string,
    type: Library['type'],
  ): Promise<LibraryItem[]> {
    const libraryCollectionRepo = DatabaseManager.getRepository(LibraryCollectionModel);
    const collectionItems: LibraryItem[] = [];

    for (const collection of collections) {
      const numberOfItems = this.countCollectionItems(collection, libraryId);
      const years = this.calculateYearsForCollection(collection);

      const [libraryCollection, collectionImages] = await Promise.all([
        libraryCollectionRepo.findOne({
          where: {
            libraryId,
            collectionId: collection.id,
          },
        }),
        resolveCollectionImages(collection, libraryId, type),
      ]);

      collectionItems.push({
        id: collection.id,
        title: collection.title,
        years,
        coverSrc: collectionImages.poster ?? '',
        backgroundSrc: collectionImages.background ?? '',
        numberOfItems,
        order: libraryCollection?.customOrder || 0,
        watched: false,
        remainingItems: 0,
        analyzingFiles: false,
        type: 'collection',
        details: await this.generateItemDetails(collection, 'collection'),
      });
    }

    return collectionItems;
  }

  private countCollectionItems(collection: CollectionModel, libraryId: string): number {
    const moviesCount =
      collection.collectionMovies?.map((movie) => movie.movie.libraryId === libraryId).length || 0;
    const seriesCount =
      collection.collectionSeries?.map((series) => series.series.libraryId === libraryId).length ||
      0;
    const albumsCount =
      collection.collectionAlbums?.map((album) => album.album.libraryId === libraryId).length || 0;

    return moviesCount + seriesCount + albumsCount;
  }

  private async buildStandaloneItems(
    library: LibraryModel,
    collections: CollectionModel[],
    userId: string,
  ): Promise<LibraryItem[]> {
    const collectionMovieIds = new Set(
      collections.flatMap(
        (collection) => collection.collectionMovies?.map((movie) => movie.movie.id) || [],
      ),
    );
    const collectionSeriesIds = new Set(
      collections.flatMap(
        (collection) => collection.collectionSeries?.map((series) => series.series.id) || [],
      ),
    );
    const collectionAlbumIds = new Set(
      collections.flatMap(
        (collection) => collection.collectionAlbums?.map((album) => album.album.id) || [],
      ),
    );

    switch (library.type) {
      case LibraryTypes.MOVIES:
        return await this.buildMovieItems(library, collectionMovieIds);
      case LibraryTypes.SHOWS:
        return await this.buildSeriesItems(library, collectionSeriesIds, userId);
      case LibraryTypes.MUSIC:
        return await this.buildAlbumItems(library, collectionAlbumIds);
      default:
        return [];
    }
  }

  private async buildMovieItems(
    library: LibraryModel,
    collectionMovieIds: Set<string>,
  ): Promise<LibraryItem[]> {
    return Promise.all(
      (library.movies || [])
        .filter((movie) => !collectionMovieIds.has(movie.id))
        .map(async (movie) => ({
          id: movie.id,
          title: movie.name,
          years: movie.year || '-',
          coverSrc: movie.coverSrc,
          numberOfItems: movie.videos?.length || 0,
          order: movie.order,
          watched: false,
          remainingItems: 0,
          analyzingFiles: movie.analyzingFiles,
          type: 'movie',
          details: await this.generateItemDetails(movie, 'movie'),
        })),
    );
  }

  private async buildSeriesItems(
    library: LibraryModel,
    collectionSeriesIds: Set<string>,
    userId: string,
  ): Promise<LibraryItem[]> {
    return Promise.all(
      (library.series || [])
        .filter((series) => !collectionSeriesIds.has(series.id))
        .map(async (series) => ({
          id: series.id,
          title: series.name,
          years: this.calculateYearsForSeries(series),
          coverSrc: series.coverSrc,
          numberOfItems: 0,
          order: series.order,
          watched: this.calculateWatchedState(series, userId),
          remainingItems: this.calculateRemainingEpisodes(series, userId),
          analyzingFiles: series.analyzingFiles,
          type: 'series',
          details: await this.generateItemDetails(series, 'series', userId),
        })),
    );
  }

  private async buildAlbumItems(
    library: LibraryModel,
    collectionAlbumIds: Set<string>,
  ): Promise<LibraryItem[]> {
    return Promise.all(
      (library.albums || [])
        .filter((album) => !collectionAlbumIds.has(album.id))
        .map(async (album) => ({
          id: album.id,
          title: album.title,
          years: album.year || '-',
          coverSrc: album.coverSrc,
          numberOfItems: 0,
          order: album.order,
          watched: false,
          remainingItems: 0,
          analyzingFiles: false,
          type: 'album',
          details: await this.generateItemDetails(album, 'album'),
        })),
    );
  }

  private async generateItemDetails(
    element: MovieModel | SeriesModel | AlbumModel | CollectionModel,
    type: ItemType,
    userId: string = '',
  ): Promise<DetailsData | null> {
    switch (type) {
      case 'movie':
        return element instanceof MovieModel ? this.buildMovieDetails(element, userId) : null;
      case 'series':
        return element instanceof SeriesModel ? this.buildSeriesDetails(element, userId) : null;
      case 'album':
        return element instanceof AlbumModel ? this.buildAlbumDetails(element) : null;
      case 'collection':
        return element instanceof CollectionModel ? this.buildCollectionDetails(element) : null;
      default:
        return null;
    }
  }

  private buildMovieDetails(element: MovieModel, userId: string): DetailsData {
    return {
      title: element.name,
      year: element.year,
      genres: element.genres ? element.genres.join(', ') : '',
      score: element.score,
      imdbScore: element.imdbScore,
      description: element.overview || '',
      directedBy: element.directedBy ? element.directedBy.join(', ') : '',
      watched: element.watchLists ? element.watchLists.some((wl) => wl.userId === userId) : false,
      inMyList: element.myLists ? element.myLists.some((ml) => ml.userId === userId) : false,
      subtitle: undefined,
      tagline: element.tagline || '',
      coverSrc: element.coverSrc || '',
      backgroundSrc: element.backgroundSrc || '',
    };
  }

  private async buildSeriesDetails(element: SeriesModel, userId: string): Promise<DetailsData> {
    const currentSeason = await useCases.getCurrentlyWatchingSeason().execute(element.id, userId);

    return {
      title: element.name,
      year: element.year,
      genres: element.genres ? element.genres.join(', ') : '',
      score: element.score,
      imdbScore: undefined,
      description: element.overview || '',
      directedBy: element.creator ? element.creator.join(', ') : '',
      watched: element.watchLists ? element.watchLists.some((wl) => wl.userId === userId) : false,
      inMyList: element.myLists ? element.myLists.some((ml) => ml.userId === userId) : false,
      subtitle: undefined,
      tagline: element.tagline || '',
      coverSrc: element.coverSrc || '',
      backgroundSrc: currentSeason?.backgroundSrc || '',
    };
  }

  private buildAlbumDetails(element: AlbumModel): DetailsData {
    return {
      title: element.title,
      year: element.year,
      genres: element.genres ? element.genres.join(', ') : '',
      score: 0,
      imdbScore: undefined,
      description: element.description || '',
      subtitle: undefined,
      coverSrc: element.coverSrc || '',
    };
  }

  private buildCollectionDetails(element: CollectionModel): DetailsData {
    return {
      title: element.title,
      genres: '',
      description: element.description || '',
      subtitle: undefined,
      coverSrc: element.posterSrc || '',
      backgroundSrc: element.backgroundSrc || '',
    };
  }

  private calculateYearsForCollection(collection: CollectionModel): string {
    const movieYears = (collection.collectionMovies || [])
      .map((movie) => movie.movie.year)
      .filter((year): year is string => Boolean(year))
      .map((year) => Number.parseInt(year, 10));

    const seriesYears = (collection.collectionSeries || []).flatMap((series) =>
      (series.series.seasons || [])
        .map((season) => season.year)
        .filter((year): year is string => Boolean(year))
        .map((year) => Number.parseInt(year, 10)),
    );

    const albumYears = (collection.collectionAlbums || [])
      .map((album) => album.album.year)
      .filter((year): year is string => Boolean(year))
      .map((year) => Number.parseInt(year, 10));

    return this.formatYearRange([...movieYears, ...seriesYears, ...albumYears]);
  }

  private formatYearRange(years: number[]): string {
    if (years.length === 0) return '-';

    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    return minYear === maxYear ? minYear.toString() : `${minYear}-${maxYear}`;
  }

  private calculateYearsForSeries(series: SeriesModel): string {
    if (!series.seasons || series.seasons.length === 0) return '-';

    const years = series.seasons
      .map((season: SeasonModel) => season.year)
      .filter((year: string) => year && year.trim() !== '');

    return this.formatYearRange(years.map((year) => Number.parseInt(year, 10)));
  }

  private calculateWatchedState(series: SeriesModel, userId: string): boolean {
    if (!series.seasons) return false;

    for (const season of series.seasons) {
      if (!season.episodes) continue;

      for (const episode of season.episodes) {
        const watchedEpisode = episode.watchLists?.find((wl) => wl.userId === userId);
        if (watchedEpisode) return true;
      }
    }

    return false;
  }

  private calculateRemainingEpisodes(series: SeriesModel, userId: string): number {
    if (!series.seasons) return 0;

    let totalEpisodes = 0;
    let watchedEpisodes = 0;

    for (const season of series.seasons) {
      if (!season.episodes) continue;

      totalEpisodes += season.episodes.length;

      for (const episode of season.episodes) {
        const watchedEpisode = episode.watchLists?.find((wl) => wl.userId === userId);
        if (watchedEpisode) watchedEpisodes++;
      }
    }

    return totalEpisodes - watchedEpisodes;
  }

  async getById(id: string) {
    try {
      const library = await LibraryModel.findOne({
        where: { id },
      });

      if (!library) {
        return null;
      }

      return library as unknown as Library;
    } catch (error: unknown) {
      logger.error(error, 'Error fetching library');
      return null;
    }
  }

  async getByAlbumId(albumId: string) {
    const validatedId = this.validateId(albumId, 'Album ID');

    return this.handleRepositoryError(async () => {
      const album = await AlbumModel.findOne({
        where: { id: validatedId },
        select: ['libraryId'],
      });

      if (!album || !album.libraryId) {
        return null;
      }

      const library = await LibraryModel.findOne({
        where: { id: album.libraryId },
      });

      if (!library) {
        return null;
      }

      return library as unknown as Library;
    }, `Failed to find library by album ID ${albumId}`);
  }

  async getByMovieId(movieId: string) {
    const validatedId = this.validateId(movieId, 'Movie ID');

    return this.handleRepositoryError(async () => {
      const movie = await MovieModel.findOne({
        where: { id: validatedId },
        select: ['libraryId'],
      });

      if (!movie || !movie.libraryId) {
        return null;
      }

      const library = await LibraryModel.findOne({
        where: { id: movie.libraryId },
      });

      if (!library) {
        return null;
      }

      return library as unknown as Library;
    }, `Failed to find library by movie ID ${movieId}`);
  }

  async getBySeriesId(seriesId: string) {
    const validatedId = this.validateId(seriesId, 'Series ID');

    return this.handleRepositoryError(async () => {
      const series = await SeriesModel.findOne({
        where: { id: validatedId },
        select: ['libraryId'],
      });

      if (!series || !series.libraryId) {
        return null;
      }

      const library = await LibraryModel.findOne({
        where: { id: series.libraryId },
      });

      if (!library) {
        return null;
      }

      return library as unknown as Library;
    }, `Failed to find library by series ID ${seriesId}`);
  }

  async getBySeasonId(seasonId: string) {
    const validatedId = this.validateId(seasonId, 'Season ID');

    return this.handleRepositoryError(async () => {
      const season = await SeasonModel.findOne({
        where: { id: validatedId },
        relations: ['series'],
      });

      if (!season || !season.series) {
        return null;
      }

      const library = await LibraryModel.findOne({
        where: { id: season.series.libraryId },
      });

      if (!library) {
        return null;
      }

      return library as unknown as Library;
    }, `Failed to find library by season ID ${seasonId}`);
  }

  async getByVideoId(videoId: string) {
    const video = await VideoModel.findOne({
      where: { id: videoId },
    });

    if (!video) return null;

    let element: EpisodeModel | MovieModel | null = null;

    if (video.episodeId) {
      element = await EpisodeModel.findOne({
        where: { id: video.episodeId },
      });
    } else if (video.movieId || video.extraId) {
      element = await MovieModel.findOne({
        where: { id: video.movieId ?? video.extraId ?? '' },
      });
    }

    if (!element) return null;

    if (element instanceof EpisodeModel) {
      const season = await SeasonModel.findOne({
        where: { id: element.seasonId },
      });

      if (!season) return null;

      const series = await SeriesModel.findOne({
        where: { id: season.seriesId },
      });

      if (!series) return null;

      const library = await LibraryModel.findOne({
        where: { id: series.libraryId },
      });

      return library ? (library as unknown as Library) : null;
    }

    const library = await LibraryModel.findOne({
      where: { id: element.libraryId },
    });

    return library ? (library as unknown as Library) : null;
  }

  async reorder(orderedLibrariesIds: string[]): Promise<boolean> {
    const dataSource = DatabaseManager.getDataSource();

    if (!dataSource) {
      return false;
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Reset all orders to temporary value
      await queryRunner.manager.update(LibraryModel, {}, { order: 9999 });

      // Update each library with new order
      for (const [index, libraryId] of orderedLibrariesIds.entries()) {
        const newOrder = index;

        await queryRunner.manager.update(LibraryModel, { id: libraryId }, { order: newOrder });
      }

      await queryRunner.commitTransaction();
      return true;
    } catch (_error) {
      await queryRunner.rollbackTransaction();
      return false;
    } finally {
      await queryRunner.release();
    }
  }

  async reorderItems(libraryId: string, orderedItems: { id: string; type: string }[]) {
    const dataSource = DatabaseManager.getDataSource();

    if (!dataSource) {
      return false;
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tempOrder = 9999;

      // Get the library
      const library = await queryRunner.manager.findOne(LibraryModel, {
        where: { id: libraryId },
      });

      if (!library) {
        await queryRunner.rollbackTransaction();
        return false;
      }

      // Reset the order of the collections
      await queryRunner.manager.update(
        LibraryCollectionModel,
        { libraryId: libraryId },
        { customOrder: tempOrder },
      );

      // Reset the order of the items based on library type
      if (library.type === 'Movies') {
        await queryRunner.manager.update(
          MovieModel,
          { libraryId: libraryId },
          { order: tempOrder },
        );
      } else if (library.type === 'Shows') {
        await queryRunner.manager.update(
          SeriesModel,
          { libraryId: libraryId },
          { order: tempOrder },
        );
      } else if (library.type === 'Music') {
        await queryRunner.manager.update(
          AlbumModel,
          { libraryId: libraryId },
          { order: tempOrder },
        );
      }

      // Assign the new order to the items
      for (let i = 0; i < orderedItems.length; i++) {
        const item = orderedItems[i];
        const newOrder = i;

        if (item.type === 'collection') {
          await queryRunner.manager.update(
            LibraryCollectionModel,
            { libraryId: libraryId, collectionId: item.id },
            { customOrder: newOrder },
          );
        } else if (item.type === 'movies') {
          await queryRunner.manager.update(
            MovieModel,
            { libraryId: libraryId, id: item.id },
            { order: newOrder },
          );
        } else if (item.type === 'shows') {
          await queryRunner.manager.update(
            SeriesModel,
            { libraryId: libraryId, id: item.id },
            { order: newOrder },
          );
        } else if (item.type === 'albums') {
          await queryRunner.manager.update(
            AlbumModel,
            { libraryId: libraryId, id: item.id },
            { order: newOrder },
          );
        }
      }

      await queryRunner.commitTransaction();
      return true;
    } catch (_error) {
      await queryRunner.rollbackTransaction();
      return false;
    } finally {
      await queryRunner.release();
    }
  }

  async create(library: Partial<Library>) {
    if (!library) {
      libraryRepositoryLogger.error('No library data provided');
      return null;
    }

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const libraryData = {
        ...library,
        id: uuidv4().split('-')[0],
      };

      try {
        // Check if the id already exists
        const existingLibrary = await LibraryModel.findOne({
          where: { id: libraryData.id },
        });

        if (existingLibrary) {
          attempts++;
          continue;
        }

        const newLibrary = LibraryModel.create(libraryData);
        await newLibrary.save();

        return newLibrary as unknown as Library;
      } catch (error) {
        libraryRepositoryLogger.error(
          error,
          `Error trying to create library (attempt ${attempts + 1}/${maxAttempts})`,
        );
        attempts++;
      }
    }

    libraryRepositoryLogger.error('Failed to create library after multiple attempts');
    return null;
  }

  async update(id: string, data: Partial<Library>): Promise<Library> {
    const validatedId = this.validateId(id, 'Library ID');
    this.validateData(data, 'Update data');
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<boolean> {
    const validatedId = this.validateId(id, 'Library ID');
    await this.helper.delete(validatedId);
    return true;
  }

  async addAnalyzedFile(libraryId: string, file: string, videoId: string): Promise<Library> {
    const library = await this.getLibraryModel(libraryId);

    if (!library) {
      throw new NotFoundException(messages.errors.notFound.library);
    }

    await library.addAnalyzedFile(file, videoId);
    await library.save();

    return library as unknown as Library;
  }

  async removeAnalyzedFile(libraryId: string, file: string): Promise<Library> {
    const library = await this.getLibraryModel(libraryId);

    if (!library) {
      throw new NotFoundException(messages.errors.notFound.library);
    }

    await library.removeAnalyzedFile(file);
    await library.save();

    return library as unknown as Library;
  }

  async addAnalyzedFolder(libraryId: string, folder: string, videoId: string): Promise<Library> {
    const library = await this.getLibraryModel(libraryId);

    if (!library) {
      throw new NotFoundException(messages.errors.notFound.library);
    }

    await library.addAnalyzedFolder(folder, videoId);
    await library.save();

    return library as unknown as Library;
  }

  async removeAnalyzedFolder(libraryId: string, folder: string): Promise<Library> {
    const library = await this.getLibraryModel(libraryId);

    if (!library) {
      throw new NotFoundException(messages.errors.notFound.library);
    }

    await library.removeAnalyzedFolder(folder);
    await library.save();

    return library as unknown as Library;
  }

  private async getLibraryModel(id: string): Promise<LibraryModel | null> {
    try {
      const library = await LibraryModel.findOne({
        where: { id },
      });

      if (!library) {
        return null;
      }

      return library;
    } catch (error: unknown) {
      logger.error(error, 'Error fetching library');
      return null;
    }
  }
}
