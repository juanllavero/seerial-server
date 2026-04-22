import type { DetailsData } from '@seerial/domain';
import { type ItemType, type LibraryItem, LibraryTypes } from '@seerial/domain';
import { In, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { AlbumModel } from '@/api/v1/albums/infrastructure/persistence/models/AlbumModel';
import { BaseRepository } from '@/api/v1/base-repository/BaseRepository';
import type { CollectionContentDTO } from '@/api/v1/collections/application/dtos/CollectionDTOs';
import { CollectionAlbumModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionAlbum';
import type { CollectionModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionModel';
import { CollectionMovieModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionMovie';
import { CollectionSeriesModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionSeries';
import { EpisodeModel } from '@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { SeasonModel } from '@/api/v1/seasons/infrastructure/persistence/models/SeasonModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
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

// Set to true to enable per-step timing measurements and their log output.
const ENABLE_TIMING_LOGS = false;

type TimingContext = Record<string, string | number | boolean | undefined>;

type LibraryContentSource = {
  id: string;
  type: Library['type'];
  collectionId?: string;
  movies?: MovieModel[];
  series?: SeriesModel[];
  albums?: AlbumModel[];
};

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

  async getContent(libraryId: string, userId: string, watched?: boolean): Promise<LibraryItem[]> {
    const totalStartedAt = this.startTiming();

    const libraryHeader = await this.measureAsync(
      'getContent.fetchLibraryHeader',
      { libraryId, userId, watched },
      () =>
        LibraryModel.findOne({
          where: { id: libraryId },
          select: ['id', 'type'],
        }),
    );

    if (!libraryHeader) {
      this.logTiming('getContent.total', totalStartedAt, {
        libraryId,
        userId,
        watched,
        resultCount: 0,
        reason: 'libraryHeaderNotFound',
      });
      return [];
    }

    const collectionRelations = this.measureSync(
      'getContent.resolveCollectionRelations',
      { libraryId, libraryType: libraryHeader.type },
      () => this.getCollectionRelations(libraryHeader.type),
    );

    const standaloneRelations = this.measureSync(
      'getContent.resolveStandaloneRelations',
      { libraryId, libraryType: libraryHeader.type },
      () => this.getStandaloneRelationsForLibraryType(libraryHeader.type),
    );

    // Fetch collections first so we can extract item IDs already loaded in
    // their relations and exclude them from the standalone query. This avoids
    // fetching every item in the library (including collection ones) with their
    // full relations, only to discard them in memory afterwards.
    const libraryCollections: LibraryCollectionModel[] = await this.measureAsync(
      'getContent.fetchLibraryCollections',
      {
        libraryId,
        libraryType: libraryHeader.type,
        relationCount: collectionRelations.length,
      },
      () =>
        LibraryCollectionModel.find({
          where: { libraryId },
          relations: collectionRelations,
          relationLoadStrategy: 'query',
          order: { customOrder: 'ASC' },
        }),
    );

    // Collections with only 1 item in this library are treated as standalone items.
    const multiItemLibraryCollections = libraryCollections.filter(
      (lc) => lc.collection && this.countCollectionItems(lc.collection, libraryId) > 1,
    );

    const excludeIds = {
      movieIds: new Set(
        multiItemLibraryCollections.flatMap(
          (lc) => lc.collection?.collectionMovies?.map((cm) => cm.movie.id) ?? [],
        ),
      ),
      seriesIds: new Set(
        multiItemLibraryCollections.flatMap(
          (lc) => lc.collection?.collectionSeries?.map((cs) => cs.series.id) ?? [],
        ),
      ),
      albumIds: new Set(
        multiItemLibraryCollections.flatMap(
          (lc) => lc.collection?.collectionAlbums?.map((ca) => ca.album.id) ?? [],
        ),
      ),
    };

    const standaloneContent: LibraryContentSource = await this.measureAsync(
      'getContent.fetchStandaloneContent',
      {
        libraryId,
        libraryType: libraryHeader.type,
        relationCount: standaloneRelations.length,
      },
      () =>
        this.getStandaloneContent(libraryId, libraryHeader.type, standaloneRelations, excludeIds),
    );

    const collections = this.measureSync(
      'getContent.extractCollections',
      { libraryId, libraryType: libraryHeader.type },
      () => multiItemLibraryCollections.map((libraryCollection) => libraryCollection.collection),
    );

    const customOrderByCollectionId = this.measureSync(
      'getContent.mapCollectionOrder',
      { libraryId, collectionCount: collections.length },
      () =>
        new Map(
          multiItemLibraryCollections.map((libraryCollection) => [
            libraryCollection.collectionId,
            libraryCollection.customOrder,
          ]),
        ),
    );

    const collectionItems = await this.measureAsync(
      'getContent.buildCollectionItems',
      {
        libraryId,
        collectionCount: collections.length,
        libraryType: libraryHeader.type,
        watched,
      },
      () =>
        this.buildCollectionItems(
          collections,
          libraryId,
          libraryHeader.type,
          customOrderByCollectionId,
          userId,
          watched,
        ),
    );
    const standaloneItems = await this.measureAsync(
      'getContent.buildStandaloneItems',
      {
        libraryId,
        collectionCount: collections.length,
        libraryType: libraryHeader.type,
        watched,
      },
      () => this.buildStandaloneItems(standaloneContent, collections, userId, watched),
    );

    const sortedItems = this.measureSync(
      'getContent.sortItems',
      {
        libraryId,
        collectionItemCount: collectionItems.length,
        standaloneItemCount: standaloneItems.length,
      },
      () =>
        [...collectionItems, ...standaloneItems].sort(
          (a, b) => a.order - b.order || a.title.localeCompare(b.title),
        ),
    );

    this.logTiming('getContent.total', totalStartedAt, {
      userId,
      watched,
      libraryId,
      libraryType: libraryHeader.type,
      collectionCount: collections.length,
      collectionItemCount: collectionItems.length,
      standaloneItemCount: standaloneItems.length,
      resultCount: sortedItems.length,
    });

    return sortedItems;
  }

  async getCollectionContent(collectionId: string, userId: string): Promise<CollectionContentDTO> {
    const [collectionMovies, collectionSeries, collectionAlbums] = await Promise.all([
      CollectionMovieModel.find({
        where: { collectionId },
        relations: ['movie', 'movie.watchLists', 'movie.videos'],
        relationLoadStrategy: 'query',
        order: { customOrder: 'ASC' },
      }),
      CollectionSeriesModel.find({
        where: { collectionId },
        relations: [
          'series',
          'series.watchLists',
          'series.seasons',
          'series.seasons.episodes',
          'series.seasons.episodes.watchLists',
        ],
        relationLoadStrategy: 'query',
        order: { customOrder: 'ASC' },
      }),
      CollectionAlbumModel.find({
        where: { collectionId },
        relations: ['album', 'album.songs'],
        relationLoadStrategy: 'query',
        order: { customOrder: 'ASC' },
      }),
    ]);

    const hasMovieCustomOrder = collectionMovies.some((cm) => cm.customOrder !== 0);
    const hasSeriesCustomOrder = collectionSeries.some((cs) => cs.customOrder !== 0);
    const hasAlbumCustomOrder = collectionAlbums.some((ca) => ca.customOrder !== 0);

    const movieOrderMap = new Map(collectionMovies.map((cm) => [cm.movieId, cm.customOrder]));
    const seriesOrderMap = new Map(collectionSeries.map((cs) => [cs.seriesId, cs.customOrder]));
    const albumOrderMap = new Map(collectionAlbums.map((ca) => [ca.albumId, ca.customOrder]));

    const movies = collectionMovies.map((cm) => cm.movie);
    const series = collectionSeries.map((cs) => cs.series);
    const albums = collectionAlbums.map((ca) => ca.album);

    const emptySet = new Set<string>();

    const [movieItems, seriesItems, albumItems] = await Promise.all([
      this.buildMovieItems(
        { id: collectionId, type: LibraryTypes.MOVIES, collectionId, movies },
        emptySet,
        userId,
        undefined,
      ),
      this.buildSeriesItems(
        { id: collectionId, type: LibraryTypes.SHOWS, collectionId, series },
        emptySet,
        userId,
        undefined,
      ),
      this.buildAlbumItems(
        { id: collectionId, type: LibraryTypes.MUSIC, collectionId, albums },
        emptySet,
      ),
    ]);

    const sortByYear = (a: LibraryItem, b: LibraryItem, desc = false): number => {
      const yearA = a.years === '-' ? null : (a.years ?? null);
      const yearB = b.years === '-' ? null : (b.years ?? null);
      if (yearA === null && yearB === null) return 0;
      if (yearA === null) return 1;
      if (yearB === null) return -1;
      return desc ? yearB.localeCompare(yearA) : yearA.localeCompare(yearB);
    };

    const sortedMovies = hasMovieCustomOrder
      ? movieItems.sort((a, b) => (movieOrderMap.get(a.id) ?? 0) - (movieOrderMap.get(b.id) ?? 0))
      : movieItems.sort((a, b) => sortByYear(a, b));

    const sortedSeries = hasSeriesCustomOrder
      ? seriesItems.sort(
        (a, b) => (seriesOrderMap.get(a.id) ?? 0) - (seriesOrderMap.get(b.id) ?? 0),
      )
      : seriesItems.sort((a, b) => sortByYear(a, b));

    const sortedAlbums = hasAlbumCustomOrder
      ? albumItems.sort((a, b) => (albumOrderMap.get(a.id) ?? 0) - (albumOrderMap.get(b.id) ?? 0))
      : albumItems.sort((a, b) => sortByYear(a, b, true));

    return { movies: sortedMovies, series: sortedSeries, albums: sortedAlbums };
  }

  private getCollectionRelations(type: Library['type']): string[] {
    switch (type) {
      case LibraryTypes.MOVIES:
        return ['collection', 'collection.collectionMovies.movie.watchLists'];
      case LibraryTypes.SHOWS:
        return ['collection', 'collection.collectionSeries.series.watchLists'];
      case LibraryTypes.MUSIC:
        return ['collection', 'collection.collectionAlbums.album'];
      default:
        return ['collection'];
    }
  }

  private getStandaloneRelationsForLibraryType(type: Library['type']): string[] {
    switch (type) {
      case LibraryTypes.MOVIES:
        return ['watchLists', 'videos'];
      case LibraryTypes.SHOWS:
        return ['watchLists', 'seasons', 'seasons.episodes', 'seasons.episodes.watchLists'];
      case LibraryTypes.MUSIC:
        return [];
      default:
        return [];
    }
  }

  private async getStandaloneContent(
    libraryId: string,
    type: Library['type'],
    relations: string[],
    excludeIds?: {
      movieIds?: Set<string>;
      seriesIds?: Set<string>;
      albumIds?: Set<string>;
    },
  ): Promise<LibraryContentSource> {
    switch (type) {
      case LibraryTypes.MOVIES: {
        const movieWhere =
          excludeIds?.movieIds && excludeIds.movieIds.size > 0
            ? { libraryId, id: Not(In([...excludeIds.movieIds])) }
            : { libraryId };
        return {
          id: libraryId,
          type,
          movies: await MovieModel.find({
            where: movieWhere,
            relations,
            relationLoadStrategy: 'query',
            order: { order: 'ASC' },
          }),
        };
      }
      case LibraryTypes.SHOWS: {
        const seriesWhere =
          excludeIds?.seriesIds && excludeIds.seriesIds.size > 0
            ? { libraryId, id: Not(In([...excludeIds.seriesIds])) }
            : { libraryId };
        return {
          id: libraryId,
          type,
          series: await SeriesModel.find({
            where: seriesWhere,
            relations,
            relationLoadStrategy: 'query',
            order: { order: 'ASC' },
          }),
        };
      }
      case LibraryTypes.MUSIC: {
        const albumWhere =
          excludeIds?.albumIds && excludeIds.albumIds.size > 0
            ? { libraryId, id: Not(In([...excludeIds.albumIds])) }
            : { libraryId };
        return {
          id: libraryId,
          type,
          albums: await AlbumModel.find({
            where: albumWhere,
            relations: ['songs'],
            relationLoadStrategy: 'query',
            order: { order: 'ASC' },
          }),
        };
      }
      default:
        return { id: libraryId, type };
    }
  }

  private async buildCollectionItems(
    collections: CollectionModel[],
    libraryId: string,
    type: Library['type'],
    customOrderByCollectionId: Map<string, number>,
    userId: string,
    watched?: boolean,
  ): Promise<LibraryItem[]> {
    const startedAt = this.startTiming();

    const items: Array<LibraryItem | null> = await Promise.all(
      collections.map(async (collection) => {
        const collectionStartedAt = this.startTiming();
        const collectionContext = {
          libraryId,
          collectionId: collection.id,
          collectionTitle: collection.title,
          libraryType: type,
          watched,
        };

        const collectionWatchStates = this.measureSync(
          'buildCollectionItems.getCollectionWatchStates',
          collectionContext,
          () => this.getCollectionWatchStates(collection, libraryId, userId),
        );

        const shouldInclude = this.measureSync(
          'buildCollectionItems.shouldIncludeCollection',
          {
            ...collectionContext,
            watchStateCount: collectionWatchStates.length,
          },
          () => this.shouldIncludeCollection(collectionWatchStates, watched),
        );

        if (!shouldInclude) {
          this.logTiming('buildCollectionItems.collection.total', collectionStartedAt, {
            ...collectionContext,
            included: false,
          });
          return null;
        }

        const numberOfItems = this.measureSync(
          'buildCollectionItems.countCollectionItems',
          collectionContext,
          () => this.countCollectionItems(collection, libraryId),
        );
        const years = this.measureSync(
          'buildCollectionItems.calculateYearsForCollection',
          collectionContext,
          () => this.calculateYearsForCollection(collection),
        );

        const collectionImages = await this.measureAsync(
          'buildCollectionItems.resolveCollectionImages',
          collectionContext,
          () => resolveCollectionImages(collection, libraryId, type),
        );
        const collectionWatched = this.measureSync(
          'buildCollectionItems.calculateCollectionWatched',
          {
            ...collectionContext,
            watchStateCount: collectionWatchStates.length,
          },
          () =>
            collectionWatchStates.length > 0 ? collectionWatchStates.every((item) => item) : false,
        );

        const result = this.measureSync(
          'buildCollectionItems.buildCollectionItem',
          { ...collectionContext, numberOfItems, collectionWatched },
          () => ({
            id: collection.id,
            title: collection.title,
            years,
            coverSrc: collectionImages.poster ?? '',
            backgroundSrc: collectionImages.background ?? '',
            numberOfItems,
            order: customOrderByCollectionId.get(collection.id) ?? 0,
            watched: collectionWatched,
            remainingItems: 0,
            analyzingFiles: false,
            type: 'collection' as const,
            collectionId: collection.id,
            details: {
              title: collection.title,
              genres: '',
              year: years,
              description: collection.description || '',
              subtitle: undefined,
              coverSrc: collectionImages.poster ?? '',
              backgroundSrc: collectionImages.background ?? '',
            },
          }),
        );

        this.logTiming('buildCollectionItems.collection.total', collectionStartedAt, {
          ...collectionContext,
          included: true,
          numberOfItems,
        });

        return result;
      }),
    );

    const filteredItems = this.measureSync(
      'buildCollectionItems.filterNullItems',
      { libraryId, collectionCount: collections.length },
      () => items.filter((item): item is LibraryItem => item !== null),
    );

    this.logTiming('buildCollectionItems.total', startedAt, {
      libraryId,
      collectionCount: collections.length,
      resultCount: filteredItems.length,
      watched,
    });

    return filteredItems;
  }

  private countCollectionItems(collection: CollectionModel, libraryId: string): number {
    const moviesCount =
      collection.collectionMovies?.filter((movie) => movie.movie.libraryId === libraryId).length ||
      0;
    const seriesCount =
      collection.collectionSeries?.filter((series) => series.series.libraryId === libraryId)
        .length || 0;
    const albumsCount =
      collection.collectionAlbums?.filter((album) => album.album.libraryId === libraryId).length ||
      0;

    return moviesCount + seriesCount + albumsCount;
  }

  private async buildStandaloneItems(
    library: LibraryContentSource,
    collections: CollectionModel[],
    userId: string,
    watched?: boolean,
  ): Promise<LibraryItem[]> {
    const startedAt = this.startTiming();

    const collectionMovieIds = this.measureSync(
      'buildStandaloneItems.buildCollectionMovieIds',
      {
        libraryId: library.id,
        collectionCount: collections.length,
        libraryType: library.type,
      },
      () =>
        new Set(
          collections.flatMap(
            (collection) => collection.collectionMovies?.map((movie) => movie.movie.id) || [],
          ),
        ),
    );
    const collectionSeriesIds = this.measureSync(
      'buildStandaloneItems.buildCollectionSeriesIds',
      {
        libraryId: library.id,
        collectionCount: collections.length,
        libraryType: library.type,
      },
      () =>
        new Set(
          collections.flatMap(
            (collection) => collection.collectionSeries?.map((series) => series.series.id) || [],
          ),
        ),
    );
    const collectionAlbumIds = this.measureSync(
      'buildStandaloneItems.buildCollectionAlbumIds',
      {
        libraryId: library.id,
        collectionCount: collections.length,
        libraryType: library.type,
      },
      () =>
        new Set(
          collections.flatMap(
            (collection) => collection.collectionAlbums?.map((album) => album.album.id) || [],
          ),
        ),
    );

    switch (library.type) {
      case LibraryTypes.MOVIES:
        return await this.measureAsync(
          'buildStandaloneItems.buildMovieItems',
          {
            libraryId: library.id,
            collectionMovieIdCount: collectionMovieIds.size,
            watched,
          },
          async () => {
            const items = await this.buildMovieItems(library, collectionMovieIds, userId, watched);

            this.logTiming('buildStandaloneItems.total', startedAt, {
              libraryId: library.id,
              libraryType: library.type,
              collectionCount: collections.length,
              resultCount: items.length,
              watched,
            });

            return items;
          },
        );
      case LibraryTypes.SHOWS:
        return await this.measureAsync(
          'buildStandaloneItems.buildSeriesItems',
          {
            libraryId: library.id,
            collectionSeriesIdCount: collectionSeriesIds.size,
            watched,
          },
          async () => {
            const items = await this.buildSeriesItems(
              library,
              collectionSeriesIds,
              userId,
              watched,
            );

            this.logTiming('buildStandaloneItems.total', startedAt, {
              libraryId: library.id,
              libraryType: library.type,
              collectionCount: collections.length,
              resultCount: items.length,
              watched,
            });

            return items;
          },
        );
      case LibraryTypes.MUSIC:
        return await this.measureAsync(
          'buildStandaloneItems.buildAlbumItems',
          {
            libraryId: library.id,
            collectionAlbumIdCount: collectionAlbumIds.size,
          },
          async () => {
            const items = await this.buildAlbumItems(library, collectionAlbumIds);

            this.logTiming('buildStandaloneItems.total', startedAt, {
              libraryId: library.id,
              libraryType: library.type,
              collectionCount: collections.length,
              resultCount: items.length,
            });

            return items;
          },
        );
      default:
        this.logTiming('buildStandaloneItems.total', startedAt, {
          libraryId: library.id,
          libraryType: library.type,
          collectionCount: collections.length,
          resultCount: 0,
          watched,
        });
        return [];
    }
  }

  private async buildMovieItems(
    library: LibraryContentSource,
    collectionMovieIds: Set<string>,
    userId: string,
    watched?: boolean,
  ): Promise<LibraryItem[]> {
    const startedAt = this.startTiming();
    const moviesWithoutCollections = this.measureSync(
      'buildMovieItems.filterCollectionMovies',
      {
        libraryId: library.id,
        movieCount: library.movies?.length || 0,
        watched,
      },
      () => (library.movies || []).filter((movie) => !collectionMovieIds.has(movie.id)),
    );
    const filteredMovies = this.measureSync(
      'buildMovieItems.filterWatchedMovies',
      {
        libraryId: library.id,
        candidateCount: moviesWithoutCollections.length,
        watched,
      },
      () =>
        moviesWithoutCollections.filter((movie) =>
          this.shouldIncludeItem(this.isMovieWatched(movie, userId), watched),
        ),
    );

    const items = await Promise.all(
      filteredMovies.map(async (movie) => {
        const movieStartedAt = this.startTiming();
        const movieWatched = this.measureSync(
          'buildMovieItems.isMovieWatched',
          { libraryId: library.id, movieId: movie.id, userId },
          () => this.isMovieWatched(movie, userId),
        );
        const details = await this.measureAsync(
          'buildMovieItems.generateItemDetails',
          { libraryId: library.id, movieId: movie.id, userId },
          () => this.generateItemDetails(movie, 'movie', userId),
        );

        const item = {
          id: movie.id,
          title: movie.name,
          years: movie.year ? movie.year.split('-')[0] : '-',
          coverSrc: movie.coverSrc,
          numberOfItems: movie.videos?.length || 0,
          order: movie.order,
          watched: movieWatched,
          remainingItems: 0,
          analyzingFiles: movie.analyzingFiles,
          type: 'movie' as const,
          collectionId: library.collectionId,
          details,
        };

        this.logTiming('buildMovieItems.movie.total', movieStartedAt, {
          libraryId: library.id,
          movieId: movie.id,
          userId,
          watched: movieWatched,
        });

        return item;
      }),
    );

    this.logTiming('buildMovieItems.total', startedAt, {
      libraryId: library.id,
      inputCount: library.movies?.length || 0,
      filteredCount: filteredMovies.length,
      resultCount: items.length,
      watched,
    });

    return items;
  }

  private async buildSeriesItems(
    library: LibraryContentSource,
    collectionSeriesIds: Set<string>,
    userId: string,
    watched?: boolean,
  ): Promise<LibraryItem[]> {
    const startedAt = this.startTiming();
    const seriesWithoutCollections = this.measureSync(
      'buildSeriesItems.filterCollectionSeries',
      {
        libraryId: library.id,
        seriesCount: library.series?.length || 0,
        watched,
      },
      () => (library.series || []).filter((series) => !collectionSeriesIds.has(series.id)),
    );
    const filteredSeries = this.measureSync(
      'buildSeriesItems.filterWatchedSeries',
      {
        libraryId: library.id,
        candidateCount: seriesWithoutCollections.length,
        watched,
      },
      () =>
        seriesWithoutCollections.filter((series) =>
          this.shouldIncludeItem(this.isSeriesWatched(series, userId), watched),
        ),
    );

    const items = await Promise.all(
      filteredSeries.map(async (series) => {
        const seriesStartedAt = this.startTiming();
        const years = this.measureSync(
          'buildSeriesItems.calculateYearsForSeries',
          { libraryId: library.id, seriesId: series.id },
          () => this.calculateYearsForSeries(series),
        );
        const seriesWatched = this.measureSync(
          'buildSeriesItems.isSeriesWatched',
          { libraryId: library.id, seriesId: series.id, userId },
          () => this.isSeriesWatched(series, userId),
        );
        const remainingItems = this.measureSync(
          'buildSeriesItems.calculateRemainingEpisodes',
          { libraryId: library.id, seriesId: series.id, userId },
          () => this.calculateRemainingEpisodes(series, userId),
        );

        // Get currently watching season of first one as fallback
        const currentSeason = this.resolveCurrentSeasonFromLoadedData(series, userId);

        const details = await this.measureAsync(
          'buildSeriesItems.generateItemDetails',
          { libraryId: library.id, seriesId: series.id, userId },
          () => this.generateItemDetails(series, 'series', userId, currentSeason ?? undefined),
        );

        const item = {
          id: series.id,
          title: series.name,
          years,
          order: series.order,
          coverSrc: series.coverSrc,
          currentSeasonNumber: currentSeason?.seasonNumber,
          numberOfItems: currentSeason?.episodes?.length ?? 0,
          watched: seriesWatched,
          remainingItems,
          analyzingFiles: series.analyzingFiles,
          type: 'series' as const,
          collectionId: library.collectionId,
          details,
        };

        this.logTiming('buildSeriesItems.series.total', seriesStartedAt, {
          libraryId: library.id,
          seriesId: series.id,
          userId,
          watched: seriesWatched,
          remainingItems,
        });

        return item;
      }),
    );

    this.logTiming('buildSeriesItems.total', startedAt, {
      libraryId: library.id,
      inputCount: library.series?.length || 0,
      filteredCount: filteredSeries.length,
      resultCount: items.length,
      watched,
    });

    return items;
  }

  private async buildAlbumItems(
    library: LibraryContentSource,
    collectionAlbumIds: Set<string>,
  ): Promise<LibraryItem[]> {
    const startedAt = this.startTiming();
    const filteredAlbums = this.measureSync(
      'buildAlbumItems.filterCollectionAlbums',
      { libraryId: library.id, albumCount: library.albums?.length || 0 },
      () => (library.albums || []).filter((album) => !collectionAlbumIds.has(album.id)),
    );

    const items = await Promise.all(
      filteredAlbums.map(async (album) => {
        const albumStartedAt = this.startTiming();
        const details = await this.measureAsync(
          'buildAlbumItems.generateItemDetails',
          { libraryId: library.id, albumId: album.id },
          () => this.generateItemDetails(album, 'album'),
        );

        const item = {
          id: album.id,
          title: album.title,
          years: album.year || '-',
          coverSrc: album.coverSrc,
          numberOfItems: album.songs?.length || 0,
          order: album.order,
          watched: false,
          remainingItems: 0,
          analyzingFiles: false,
          type: 'album' as const,
          collectionId: library.collectionId,
          details,
        };

        this.logTiming('buildAlbumItems.album.total', albumStartedAt, {
          libraryId: library.id,
          albumId: album.id,
        });

        return item;
      }),
    );

    this.logTiming('buildAlbumItems.total', startedAt, {
      libraryId: library.id,
      inputCount: library.albums?.length || 0,
      filteredCount: filteredAlbums.length,
      resultCount: items.length,
    });

    return items;
  }

  public async generateItemDetails(
    element: MovieModel | SeriesModel | AlbumModel | CollectionModel,
    type: ItemType,
    userId: string = '',
    currentSeason?: SeasonModel,
  ): Promise<DetailsData | null> {
    const startedAt = this.startTiming();
    const itemId = 'id' in element ? element.id : undefined;

    try {
      switch (type) {
        case 'movie':
          return element instanceof MovieModel ? this.buildMovieDetails(element, userId) : null;
        case 'series':
          return element instanceof SeriesModel
            ? this.buildSeriesDetails(element, userId, currentSeason)
            : null;
        case 'album':
          return element instanceof AlbumModel ? this.buildAlbumDetails(element) : null;
        default:
          return null;
      }
    } finally {
      this.logTiming('generateItemDetails.total', startedAt, {
        itemType: type,
        itemId,
        userId,
      });
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
      watched: this.isMovieWatched(element, userId),
      subtitle: undefined,
      tagline: element.tagline || '',
      coverSrc: element.coverSrc || '',
      logoSrc: element.logoSrc || '',
      backgroundSrc: element.backgroundSrc || '',
    };
  }

  private buildSeriesDetails(
    element: SeriesModel,
    userId: string,
    currentSeason?: SeasonModel,
  ): DetailsData {
    const resolvedCurrentSeason =
      currentSeason ?? this.resolveCurrentSeasonFromLoadedData(element, userId);

    return {
      title: element.name,
      year: element.year,
      genres: element.genres ? element.genres.join(', ') : '',
      score: element.score,
      imdbScore: undefined,
      description: element.overview || '',
      createdBy: element.creator ? element.creator.join(', ') : '',
      watched: this.isSeriesWatched(element, userId),
      subtitle: resolvedCurrentSeason?.name,
      tagline: element.tagline || '',
      coverSrc: element.coverSrc || '',
      logoSrc: element.logoSrc || '',
      backgroundSrc: resolvedCurrentSeason?.backgroundSrc || '',
    };
  }

  /**
   * Determines which season the user is currently watching using data already
   * loaded in the series relations (seasons.episodes.watchLists). This avoids
   * an additional DB query per series when building the library grid.
   *
   * Logic: find the highest-numbered season that has at least one episode
   * marked as watched by the user. Falls back to season 1 (or the first
   * available season) if the user has not started any episode.
   */
  private resolveCurrentSeasonFromLoadedData(
    series: SeriesModel,
    userId: string,
  ): SeasonModel | null {
    if (!series.seasons || series.seasons.length === 0) return null;

    const sortedDesc = [...series.seasons].sort((a, b) => b.seasonNumber - a.seasonNumber);

    const currentSeason = sortedDesc.find((season) =>
      season.episodes?.some((episode) =>
        episode.watchLists?.some((wl) => wl.userId === userId && wl.watched),
      ),
    );

    // Fallback: lowest-numbered season (last element in DESC-sorted array)
    return currentSeason ?? sortedDesc[sortedDesc.length - 1] ?? null;
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

  private isMovieWatched(movie: MovieModel, userId: string): boolean {
    return (
      movie.watchLists?.some((watchList) => watchList.userId === userId && watchList.watched) ??
      false
    );
  }

  private isSeriesWatched(series: SeriesModel, userId: string): boolean {
    return (
      series.watchLists?.some((watchList) => watchList.userId === userId && watchList.watched) ??
      false
    );
  }

  private shouldIncludeItem(itemWatched: boolean, watched?: boolean): boolean {
    if (watched === undefined) {
      return true;
    }

    return itemWatched === watched;
  }

  private getCollectionWatchStates(
    collection: CollectionModel,
    libraryId: string,
    userId: string,
  ): boolean[] {
    const movieWatchStates = (collection.collectionMovies || [])
      .filter((movie) => movie.movie.libraryId === libraryId)
      .map((movie) => this.isMovieWatched(movie.movie, userId));

    const seriesWatchStates = (collection.collectionSeries || [])
      .filter((series) => series.series.libraryId === libraryId)
      .map((series) => this.isSeriesWatched(series.series, userId));

    return [...movieWatchStates, ...seriesWatchStates];
  }

  private shouldIncludeCollection(collectionWatchStates: boolean[], watched?: boolean): boolean {
    if (watched === undefined || collectionWatchStates.length === 0) {
      return true;
    }

    if (watched) {
      return collectionWatchStates.every((itemWatched) => itemWatched);
    }

    return collectionWatchStates.some((itemWatched) => !itemWatched);
  }

  private calculateRemainingEpisodes(series: SeriesModel, userId: string): number {
    const startedAt = this.startTiming();

    if (!series.seasons) return 0;

    let totalEpisodes = 0;
    let watchedEpisodes = 0;

    for (const season of series.seasons) {
      if (!season.episodes) continue;

      totalEpisodes += season.episodes.length;

      for (const episode of season.episodes) {
        const watchedEpisode = episode.watchLists?.find((wl) => wl.userId === userId && wl.watched);
        if (watchedEpisode) watchedEpisodes++;
      }
    }

    const remainingEpisodes = totalEpisodes - watchedEpisodes;

    this.logTiming('calculateRemainingEpisodes.total', startedAt, {
      seriesId: series.id,
      userId,
      totalEpisodes,
      watchedEpisodes,
      remainingEpisodes,
    });

    return remainingEpisodes;
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

      if (!album?.libraryId) {
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

      if (!movie?.libraryId) {
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

      if (!series?.libraryId) {
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

      if (!season?.series) {
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

  private startTiming(): bigint {
    if (!ENABLE_TIMING_LOGS) return 0n;
    return process.hrtime.bigint();
  }

  private logTiming(step: string, startedAt: bigint, context: TimingContext = {}): number {
    if (!ENABLE_TIMING_LOGS) return 0;
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
    const roundedDurationMs = Number(durationMs.toFixed(2));

    libraryRepositoryLogger.info(
      {
        step,
        durationMs: roundedDurationMs,
        ...context,
      },
      'Library content timing',
    );

    return roundedDurationMs;
  }

  private measureSync<T>(step: string, context: TimingContext, operation: () => T): T {
    const startedAt = this.startTiming();

    try {
      return operation();
    } finally {
      this.logTiming(step, startedAt, context);
    }
  }

  private async measureAsync<T>(
    step: string,
    context: TimingContext,
    operation: () => Promise<T>,
  ): Promise<T> {
    const startedAt = this.startTiming();

    try {
      return await operation();
    } finally {
      this.logTiming(step, startedAt, context);
    }
  }
}
