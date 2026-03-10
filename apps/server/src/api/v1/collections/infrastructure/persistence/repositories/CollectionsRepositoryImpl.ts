import { BaseRepository } from '@/api/v1/base-repository/BaseRepository';
import { LibraryCollectionModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryCollectionModel';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { DatabaseManager } from '@/api/v1/shared/infrastructure/persistence/DatabaseManager';
import { getCollectionItemsKey } from '@/api/v1/shared/infrastructure/services/FileSearchService';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';
import type { ReorderItemDTO } from '../../../application/dtos/CollectionDTOs';
import type { CollectionsRepositoryPort } from '../../../application/ports/CollectionsRepositoryPort';
import type { Collection } from '../../../domain/Collection';
import { CollectionAlbumModel } from '../models/CollectionAlbum';
import { CollectionModel } from '../models/CollectionModel';
import { CollectionMovieModel } from '../models/CollectionMovie';
import { CollectionSeriesModel } from '../models/CollectionSeries';

export class CollectionsRepositoryImpl extends BaseRepository implements CollectionsRepositoryPort {
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<CollectionModel, Collection>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(CollectionModel, {
      entityName: 'Collection',
      generateShortId: true,
    });
  }

  async getAll(libraryId: string): Promise<Collection[]> {
    const validatedId = this.validateId(libraryId, 'Library ID');

    const collections = await LibraryModel.findOne({
      where: { id: validatedId },
      relations: ['collections'],
    });

    return collections?.libraryCollections.map((c) => c.collection as unknown as Collection) || [];
  }

  async getById(id: string): Promise<Collection | null> {
    const validatedId = this.validateId(id, 'Collection ID');
    return this.helper.findById(validatedId);
  }

  async getByName(name: string): Promise<Collection | null> {
    return this.helper.findByField('title', name);
  }

  async getByLibraryId(libraryId: string, type: string): Promise<Collection[]> {
    const validatedId = this.validateId(libraryId, 'Library ID');

    const collectionItemsKey = getCollectionItemsKey(type);

    const data = await LibraryModel.findOne({
      where: { id: validatedId },
      relations: ['collections', `collections.${collectionItemsKey}` as any],
    });

    return (data?.libraryCollections || []).map((c) => c.collection as unknown as Collection);
  }

  async add(collection: Partial<Collection>): Promise<Collection | null> {
    this.validateData(collection, 'Collection data');

    // Check if collection already exists by title
    if (collection.title) {
      const existing = await CollectionModel.findOne({
        where: { title: collection.title },
      });
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
    await this.helper.delete(validatedId);
    return true;
  }

  async addAlbum(collectionId: string, albumId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, albumId });

    const relationData = {
      collectionId: validated.collectionId,
      albumId: validated.albumId,
    };

    await this.helper.createRelationship(CollectionAlbumModel, relationData, true);
  }

  async addMovie(collectionId: string, movieId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, movieId });

    const relationData = {
      collectionId: validated.collectionId,
      movieId: validated.movieId,
    };

    await this.helper.createRelationship(CollectionMovieModel, relationData, true);
  }

  async addSeries(collectionId: string, seriesId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, seriesId });

    const relationData = {
      collectionId: validated.collectionId,
      seriesId: validated.seriesId,
    };

    await this.helper.createRelationship(CollectionSeriesModel, relationData, true);
  }

  async addLibrary(libraryId: string, collectionId: string): Promise<void> {
    const validated = this.validateIds({ libraryId, collectionId });

    const relationData = {
      libraryId: validated.libraryId,
      collectionId: validated.collectionId,
    };

    await this.helper.createRelationship(LibraryCollectionModel, relationData, true);
  }

  async removeSeries(collectionId: string, seriesId: string): Promise<boolean> {
    const validated = this.validateIds({ collectionId, seriesId });

    const whereCondition = {
      collectionId: validated.collectionId,
      seriesId: validated.seriesId,
    };

    await this.helper.deleteRelationship(CollectionSeriesModel, whereCondition);
    return true;
  }

  async removeMovie(collectionId: string, movieId: string): Promise<boolean> {
    const validated = this.validateIds({ collectionId, movieId });

    const whereCondition = {
      collectionId: validated.collectionId,
      movieId: validated.movieId,
    };

    await this.helper.deleteRelationship(CollectionMovieModel, whereCondition);
    return true;
  }

  async removeAlbum(collectionId: string, albumId: string): Promise<boolean> {
    const validated = this.validateIds({ collectionId, albumId });

    const whereCondition = {
      collectionId: validated.collectionId,
      albumId: validated.albumId,
    };

    await this.helper.deleteRelationship(CollectionAlbumModel, whereCondition);
    return true;
  }

  async reorderContent(collectionId: string, orderedItems: ReorderItemDTO[]): Promise<void> {
    const validatedId = this.validateId(collectionId, 'Collection ID');

    const dataSource = DatabaseManager.getDataSource();

    if (!dataSource) {
      throw new Error('Database not initialized');
    }

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const tempOrder = 9999;

      await queryRunner.manager.update(
        CollectionMovieModel,
        { collectionId: validatedId },
        { customOrder: tempOrder },
      );
      await queryRunner.manager.update(
        CollectionSeriesModel,
        { collectionId: validatedId },
        { customOrder: tempOrder },
      );
      await queryRunner.manager.update(
        CollectionAlbumModel,
        { collectionId: validatedId },
        { customOrder: tempOrder },
      );

      for (const [index, item] of orderedItems.entries()) {
        const newOrder = index;
        const type = (item.type || '').toLowerCase();

        if (type === 'movie' || type === 'movies') {
          await queryRunner.manager.update(
            CollectionMovieModel,
            { collectionId: validatedId, movieId: item.id },
            { customOrder: newOrder },
          );
        } else if (type === 'series' || type === 'show' || type === 'shows') {
          await queryRunner.manager.update(
            CollectionSeriesModel,
            { collectionId: validatedId, seriesId: item.id },
            { customOrder: newOrder },
          );
        } else if (type === 'album' || type === 'albums') {
          await queryRunner.manager.update(
            CollectionAlbumModel,
            { collectionId: validatedId, albumId: item.id },
            { customOrder: newOrder },
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
