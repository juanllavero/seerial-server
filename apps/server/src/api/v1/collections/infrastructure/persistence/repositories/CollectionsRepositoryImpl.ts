import type { Album, Movie, Series, Song } from '@seerial/domain';
import { AlbumModel } from '@/api/v1/albums/infrastructure/persistence/models/AlbumModel';
import { BaseRepository } from '@/api/v1/base-repository/BaseRepository';
import { LibraryCollectionModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryCollectionModel';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
import { DatabaseManager } from '@/api/v1/shared/infrastructure/persistence/DatabaseManager';
import { getCollectionItemsKey } from '@/api/v1/shared/infrastructure/services/FileSearchService';
import { SongModel } from '@/api/v1/songs/infrastructure/persistence/models/SongModel';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';
import type {
  CollectionSummaryDTO,
  ReorderItemDTO,
} from '../../../application/dtos/CollectionDTOs';
import type { CollectionsRepositoryPort } from '../../../application/ports/CollectionsRepositoryPort';
import type { Collection } from '../../../domain/Collection';
import { CollectionModel } from '../models/CollectionModel';

export class CollectionsRepositoryImpl extends BaseRepository implements CollectionsRepositoryPort {
  private readonly MAX_COLLECTION_SONGS = 10;
  private readonly MAX_RECENT_ALBUM_CANDIDATES = 12;

  private helper: GenericRepositoryHelper<CollectionModel, Collection>;

  constructor() {
    super();
    this.helper = new GenericRepositoryHelper(CollectionModel, {
      entityName: 'Collection',
      generateShortId: true,
    });
  }

  async getAllSummary(): Promise<CollectionSummaryDTO[]> {
    const collections = await CollectionModel.find({ order: { title: 'ASC' } });

    const counts = await Promise.all(
      collections.map(async (c) => {
        const [movieCount, seriesCount, albumCount] = await Promise.all([
          MovieModel.count({ where: { collectionId: c.id } }),
          SeriesModel.count({ where: { collectionId: c.id } }),
          AlbumModel.count({ where: { collectionId: c.id } }),
        ]);
        return { id: c.id, title: c.title, itemCount: movieCount + seriesCount + albumCount };
      }),
    );

    return counts;
  }

  async getAll(libraryId: string): Promise<Collection[]> {
    const validatedId = this.validateId(libraryId, 'Library ID');

    const library = await LibraryModel.findOne({
      where: { id: validatedId },
      relations: ['libraryCollections', 'libraryCollections.collection'],
    });

    return library?.libraryCollections.map((c) => c.collection as unknown as Collection) || [];
  }

  async getById(id: string): Promise<Collection | null> {
    const validatedId = this.validateId(id, 'Collection ID');

    const collection = await CollectionModel.findOne({ where: { id: validatedId } });
    if (!collection) return null;

    const [movies, series, albums] = await Promise.all([
      MovieModel.find({ where: { collectionId: validatedId }, order: { collectionOrder: 'ASC' } }),
      SeriesModel.find({
        where: { collectionId: validatedId },
        order: { collectionOrder: 'ASC' },
      }),
      AlbumModel.find({ where: { collectionId: validatedId }, order: { collectionOrder: 'ASC' } }),
    ]);

    const songs = await this.findPrioritizedCollectionSongs(validatedId, albums);

    return {
      id: collection.id,
      title: collection.title,
      description: collection.description,
      backgroundSrc: collection.backgroundSrc,
      backgroundsUrls: collection.backgroundsUrls,
      coverSrc: collection.posterSrc,
      coversUrls: collection.postersUrls,
      numberOfItems: movies.length + series.length + albums.length,
      musicPosterSrc: collection.musicPosterSrc,
      shows: series as unknown as Series[],
      movies: movies as unknown as Movie[],
      albums: albums as unknown as Album[],
      songs,
    };
  }

  private async findPrioritizedCollectionSongs(
    collectionId: string,
    albums: AlbumModel[],
  ): Promise<Song[]> {
    const singlesAlbumIds = await this.findSinglesAlbumIds(collectionId);
    const selectedSongs = await this.findSinglesSongs(singlesAlbumIds);
    const selectedSongIds = new Set<string>();
    for (const song of selectedSongs) selectedSongIds.add(song.id);

    const remainingSlots = this.MAX_COLLECTION_SONGS - selectedSongs.length;
    if (remainingSlots <= 0) {
      return selectedSongs as unknown as Song[];
    }

    const singlesAlbumIdSet = new Set(singlesAlbumIds);
    const recentAlbumIds = albums
      .filter((album) => !singlesAlbumIdSet.has(album.id))
      .sort((a, b) => this.getAlbumYearNumber(b.year) - this.getAlbumYearNumber(a.year))
      .slice(0, this.MAX_RECENT_ALBUM_CANDIDATES)
      .map((album) => album.id);

    if (recentAlbumIds.length === 0) {
      return selectedSongs as unknown as Song[];
    }

    const recentSongs = await this.findSongsFromRecentAlbums(recentAlbumIds, remainingSlots);
    for (const song of recentSongs) {
      if (selectedSongIds.has(song.id)) continue;
      selectedSongs.push(song);
      selectedSongIds.add(song.id);
      if (selectedSongs.length >= this.MAX_COLLECTION_SONGS) break;
    }

    return selectedSongs as unknown as Song[];
  }

  private async findSinglesAlbumIds(collectionId: string): Promise<string[]> {
    const singlesAlbumRows = await SongModel.createQueryBuilder('song')
      .select('song.album_id', 'albumId')
      .innerJoin('song.album', 'album')
      .where('album.collection_id = :collectionId', { collectionId })
      .groupBy('song.album_id')
      .having('COUNT(song.id) = 1')
      .getRawMany<{ albumId: string }>();

    return singlesAlbumRows.map((row) => row.albumId);
  }

  private async findSinglesSongs(singlesAlbumIds: string[]): Promise<SongModel[]> {
    if (singlesAlbumIds.length === 0) return [];

    return SongModel.createQueryBuilder('song')
      .where('song.album_id IN (:...albumIds)', { albumIds: singlesAlbumIds })
      .orderBy('RANDOM()')
      .limit(this.MAX_COLLECTION_SONGS)
      .getMany();
  }

  private async findSongsFromRecentAlbums(
    recentAlbumIds: string[],
    maxSongs: number,
  ): Promise<SongModel[]> {
    const recentSongs = await SongModel.createQueryBuilder('song')
      .where('song.album_id IN (:...albumIds)', { albumIds: recentAlbumIds })
      .getMany();

    const queuedByAlbum = new Map<string, SongModel[]>();
    for (const song of recentSongs) {
      const queue = queuedByAlbum.get(song.albumId) ?? [];
      queue.push(song);
      queuedByAlbum.set(song.albumId, queue);
    }

    for (const albumId of recentAlbumIds) {
      const queue = queuedByAlbum.get(albumId);
      if (!queue || queue.length <= 1) continue;

      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
    }

    const selected: SongModel[] = [];
    while (selected.length < maxSongs) {
      let added = false;

      for (const albumId of recentAlbumIds) {
        const song = queuedByAlbum.get(albumId)?.shift();
        if (!song) continue;

        selected.push(song);
        added = true;

        if (selected.length >= maxSongs) break;
      }

      if (!added) break;
    }

    return selected;
  }

  private getAlbumYearNumber(year?: string): number {
    if (!year) return 0;
    const parsedYear = Number.parseInt(year, 10);
    return Number.isNaN(parsedYear) ? 0 : parsedYear;
  }

  async getByName(name: string): Promise<Collection | null> {
    return this.helper.findByField('title', name);
  }

  async getByLibraryId(libraryId: string, type: string): Promise<Collection[]> {
    const validatedId = this.validateId(libraryId, 'Library ID');

    const collectionItemsKey = getCollectionItemsKey(type);
    const relationByCollectionKey: Record<string, string> = {
      movies: 'movies',
      shows: 'series',
      albums: 'albums',
    };

    const data = await LibraryModel.findOne({
      where: { id: validatedId },
      relations: [
        'libraryCollections',
        'libraryCollections.collection',
        `libraryCollections.collection.${relationByCollectionKey[collectionItemsKey]}`,
      ],
    });

    return (data?.libraryCollections || []).map((c) => c.collection as unknown as Collection);
  }

  async add(collection: Partial<Collection>): Promise<Collection | null> {
    this.validateData(collection, 'Collection data');

    if (collection.title) {
      const existing = await CollectionModel.findOne({ where: { title: collection.title } });
      if (existing) return existing as unknown as Collection;
    }

    return this.helper.create(collection, true);
  }

  async update(id: string, data: Partial<Collection>): Promise<Collection> {
    const validatedId = this.validateId(id, 'Collection ID');
    this.validateData(data, 'Update data');
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<boolean> {
    const validatedId = this.validateId(id, 'Collection ID');

    await Promise.all([
      MovieModel.createQueryBuilder()
        .update()
        .set({ collectionId: null, collectionOrder: 0 })
        .where('collection_id = :id', { id: validatedId })
        .execute(),
      SeriesModel.createQueryBuilder()
        .update()
        .set({ collectionId: null, collectionOrder: 0 })
        .where('collection_id = :id', { id: validatedId })
        .execute(),
      AlbumModel.createQueryBuilder()
        .update()
        .set({ collectionId: null, collectionOrder: 0 })
        .where('collection_id = :id', { id: validatedId })
        .execute(),
    ]);

    await this.helper.delete(validatedId);
    return true;
  }

  async addAlbum(collectionId: string, albumId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, albumId });
    await AlbumModel.createQueryBuilder()
      .update()
      .set({ collectionId: validated.collectionId })
      .where('id = :id', { id: validated.albumId })
      .execute();
  }

  async addMovie(collectionId: string, movieId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, movieId });
    await MovieModel.createQueryBuilder()
      .update()
      .set({ collectionId: validated.collectionId })
      .where('id = :id', { id: validated.movieId })
      .execute();
  }

  async addSeries(collectionId: string, seriesId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, seriesId });
    await SeriesModel.createQueryBuilder()
      .update()
      .set({ collectionId: validated.collectionId })
      .where('id = :id', { id: validated.seriesId })
      .execute();
  }

  async addLibrary(libraryId: string, collectionId: string): Promise<void> {
    const validated = this.validateIds({ libraryId, collectionId });
    const relationData = { libraryId: validated.libraryId, collectionId: validated.collectionId };
    await this.helper.createRelationship(LibraryCollectionModel, relationData, true);
  }

  async removeSeries(collectionId: string, seriesId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, seriesId });
    await SeriesModel.createQueryBuilder()
      .update()
      .set({ collectionId: null, collectionOrder: 0 })
      .where('id = :id AND collection_id = :collectionId', {
        id: validated.seriesId,
        collectionId: validated.collectionId,
      })
      .execute();
  }

  async removeMovie(collectionId: string, movieId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, movieId });
    await MovieModel.createQueryBuilder()
      .update()
      .set({ collectionId: null, collectionOrder: 0 })
      .where('id = :id AND collection_id = :collectionId', {
        id: validated.movieId,
        collectionId: validated.collectionId,
      })
      .execute();
  }

  async removeAlbum(collectionId: string, albumId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, albumId });
    await AlbumModel.createQueryBuilder()
      .update()
      .set({ collectionId: null, collectionOrder: 0 })
      .where('id = :id AND collection_id = :collectionId', {
        id: validated.albumId,
        collectionId: validated.collectionId,
      })
      .execute();
  }

  async hasMovie(collectionId: string, movieId: string): Promise<boolean> {
    const validated = this.validateIds({ collectionId, movieId });
    const count = await MovieModel.count({
      where: { id: validated.movieId, collectionId: validated.collectionId },
    });
    return count > 0;
  }

  async hasSeries(collectionId: string, seriesId: string): Promise<boolean> {
    const validated = this.validateIds({ collectionId, seriesId });
    const count = await SeriesModel.count({
      where: { id: validated.seriesId, collectionId: validated.collectionId },
    });
    return count > 0;
  }

  async hasAlbum(collectionId: string, albumId: string): Promise<boolean> {
    const validated = this.validateIds({ collectionId, albumId });
    const count = await AlbumModel.count({
      where: { id: validated.albumId, collectionId: validated.collectionId },
    });
    return count > 0;
  }

  async reorderContent(collectionId: string, orderedItems: ReorderItemDTO[]): Promise<void> {
    const validatedId = this.validateId(collectionId, 'Collection ID');

    const dataSource = DatabaseManager.getDataSource();
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const [index, item] of orderedItems.entries()) {
        const type = (item.type || '').toLowerCase();

        if (type === 'movie' || type === 'movies') {
          await queryRunner.manager.update(
            MovieModel,
            { id: item.id, collectionId: validatedId },
            { collectionOrder: index },
          );
        } else if (type === 'series' || type === 'show' || type === 'shows') {
          await queryRunner.manager.update(
            SeriesModel,
            { id: item.id, collectionId: validatedId },
            { collectionOrder: index },
          );
        } else if (type === 'album' || type === 'albums') {
          await queryRunner.manager.update(
            AlbumModel,
            { id: item.id, collectionId: validatedId },
            { collectionOrder: index },
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
