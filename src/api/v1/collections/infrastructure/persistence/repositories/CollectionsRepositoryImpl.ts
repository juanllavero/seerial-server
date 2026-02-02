import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { LibraryCollectionModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryCollectionModel";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { DatabaseManager } from "@/api/v1/shared/infrastructure/persistence/DatabaseManager";
import {
  getCollectionItemsKey,
  getItemModel,
} from "@/api/v1/shared/infrastructure/services/FileSearchService";
import { v4 as uuidv4 } from "uuid";
import { ReorderItemDTO } from "../../../application/dtos/CollectionDTOs";
import { CollectionsRepositoryPort } from "../../../application/ports/CollectionRepositoryPort";
import { Collection } from "../../../domain/Collection";
import { CollectionAlbumModel } from "../models/CollectionAlbum";
import { CollectionModel } from "../models/CollectionModel";
import { CollectionMovieModel } from "../models/CollectionMovie";
import { CollectionSeriesModel } from "../models/CollectionSeries";

export class CollectionsRepositoryImpl
  extends BaseRepository
  implements CollectionsRepositoryPort
{
  async getAll(libraryId: string): Promise<Collection[]> {
    const validatedId = this.validateId(libraryId, "Library ID");

    return this.handleRepositoryError(async () => {
      const data = await LibraryModel.findOne({
        where: { id: validatedId },
        relations: ["collections"],
      });

      return data?.collections.map((d) => d as unknown as Collection) || [];
    }, `Failed to retrieve collections for library ${libraryId}`);
  }

  async getById(id: string): Promise<Collection | null> {
    const validatedId = this.validateId(id, "Collection ID");

    return this.handleRepositoryError(async () => {
      const data = await CollectionModel.findOne({
        where: { id: validatedId },
        relations: ["shows", "movies", "albums"],
      });
      return data ? (data as unknown as Collection) : null;
    }, `Failed to retrieve collection with ID ${id}`);
  }

  async getByLibraryId(libraryId: string, type: string): Promise<Collection[]> {
    const validatedId = this.validateId(libraryId, "Library ID");

    return this.handleRepositoryError(async () => {
      const collectionItemsKey = getCollectionItemsKey(type);
      const ItemModel = getItemModel(type);

      const data = await LibraryModel.findOne({
        where: { id: validatedId },
        relations: ["collections", `collections.${collectionItemsKey}` as any],
      });

      return (data?.collections || []).map((d) => d as unknown as Collection);
    }, `Failed to retrieve collections for library ${libraryId} with type ${type}`);
  }

  async add(collection: Partial<Collection>): Promise<Collection | null> {
    this.validateData(collection, "Collection data");

    return this.handleRepositoryError(async () => {
      const existing = collection.title
        ? await CollectionModel.findOne({ where: { title: collection.title } })
        : null;

      if (existing) return existing as unknown as Collection;

      const newData = { ...collection, id: uuidv4().split("-")[0] };
      const created = CollectionModel.create(newData);
      await created.save();
      return created as unknown as Collection;
    }, "Failed to create collection");
  }

  async update(id: string, data: Partial<Collection>): Promise<Collection> {
    const validatedId = this.validateId(id, "Collection ID");
    this.validateData(data, "Update data");

    return this.handleRepositoryError(async () => {
      const result = await CollectionModel.update({ id: validatedId }, data);

      this.ensureAffected(result.affected || 0, `Collection ${id} not found`);

      const updated = await this.getById(id);
      if (!updated) {
        throw new Error(`Failed to retrieve collection ${id}`);
      }

      return updated;
    }, `Failed to update collection ${id}`);
  }

  async delete(id: string): Promise<boolean> {
    const validatedId = this.validateId(id, "Collection ID");

    return this.handleRepositoryError(async () => {
      const result = await CollectionModel.delete({ id: validatedId });

      this.ensureAffected(result.affected || 0, `Collection ${id} not found`);
      return true;
    }, `Failed to delete collection ${id}`);
  }

  async addAlbum(collectionId: string, albumId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, albumId });

    return this.handleRepositoryError(async () => {
      // Check if relation already exists
      const existing = await CollectionAlbumModel.findOne({
        where: {
          collectionId: validated.collectionId,
          albumId: validated.albumId,
        },
      });

      if (existing) return;

      const newRelation = CollectionAlbumModel.create({
        collectionId: validated.collectionId,
        albumId: validated.albumId,
      });
      await newRelation.save();
    }, `Failed to add album ${albumId} to collection ${collectionId}`);
  }

  async addMovie(collectionId: string, movieId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, movieId });

    return this.handleRepositoryError(async () => {
      // Check if relation already exists
      const existing = await CollectionMovieModel.findOne({
        where: {
          collectionId: validated.collectionId,
          movieId: validated.movieId,
        },
      });

      if (existing) return;

      const newRelation = CollectionMovieModel.create({
        collectionId: validated.collectionId,
        movieId: validated.movieId,
      });
      await newRelation.save();
    }, `Failed to add movie ${movieId} to collection ${collectionId}`);
  }

  async addSeries(collectionId: string, seriesId: string): Promise<void> {
    const validated = this.validateIds({ collectionId, seriesId });

    return this.handleRepositoryError(async () => {
      // Check if relation already exists
      const existing = await CollectionSeriesModel.findOne({
        where: {
          collectionId: validated.collectionId,
          seriesId: validated.seriesId,
        },
      });

      if (existing) return;

      const newRelation = CollectionSeriesModel.create({
        collectionId: validated.collectionId,
        seriesId: validated.seriesId,
      });
      await newRelation.save();
    }, `Failed to add series ${seriesId} to collection ${collectionId}`);
  }

  async addLibrary(libraryId: string, collectionId: string): Promise<void> {
    const validated = this.validateIds({ libraryId, collectionId });

    return this.handleRepositoryError(async () => {
      // Check if relation already exists
      const existing = await LibraryCollectionModel.findOne({
        where: {
          libraryId: validated.libraryId,
          collectionId: validated.collectionId,
        },
      });

      if (existing) return;

      const newRelation = LibraryCollectionModel.create({
        libraryId: validated.libraryId,
        collectionId: validated.collectionId,
      });
      await newRelation.save();
    }, `Failed to add collection ${collectionId} to library ${libraryId}`);
  }

  async removeSeries(collectionId: string, seriesId: string): Promise<boolean> {
    const validated = this.validateIds({ collectionId, seriesId });

    return this.handleRepositoryError(async () => {
      const result = await CollectionSeriesModel.delete({
        collectionId: validated.collectionId,
        seriesId: validated.seriesId,
      });

      this.ensureAffected(result.affected || 0, `CollectionSeries not found`);
      return true;
    }, `Failed to remove series ${seriesId} from collection ${collectionId}`);
  }

  async removeMovie(collectionId: string, movieId: string): Promise<boolean> {
    const validated = this.validateIds({ collectionId, movieId });

    return this.handleRepositoryError(async () => {
      const result = await CollectionMovieModel.delete({
        collectionId: validated.collectionId,
        movieId: validated.movieId,
      });

      this.ensureAffected(result.affected || 0, `CollectionMovie not found`);
      return true;
    }, `Failed to remove movie ${movieId} from collection ${collectionId}`);
  }

  async removeAlbum(collectionId: string, albumId: string): Promise<boolean> {
    const validated = this.validateIds({ collectionId, albumId });

    return this.handleRepositoryError(async () => {
      const result = await CollectionAlbumModel.delete({
        collectionId: validated.collectionId,
        albumId: validated.albumId,
      });

      this.ensureAffected(result.affected || 0, `CollectionAlbum not found`);
      return true;
    }, `Failed to remove album ${albumId} from collection ${collectionId}`);
  }

  async reorderContent(
    collectionId: string,
    orderedItems: ReorderItemDTO[]
  ): Promise<void> {
    const validatedId = this.validateId(collectionId, "Collection ID");

    return this.handleRepositoryError(async () => {
      const dataSource = DatabaseManager.getDataSource();

      if (!dataSource) {
        throw new Error("Database not initialized");
      }

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        const tempOrder = 9999;

        await queryRunner.manager.update(
          CollectionMovieModel,
          { collectionId: validatedId },
          { customOrder: tempOrder }
        );
        await queryRunner.manager.update(
          CollectionSeriesModel,
          { collectionId: validatedId },
          { customOrder: tempOrder }
        );
        await queryRunner.manager.update(
          CollectionAlbumModel,
          { collectionId: validatedId },
          { customOrder: tempOrder }
        );

        for (const [index, item] of orderedItems.entries()) {
          const newOrder = index;
          const type = (item.type || "").toLowerCase();

          if (type === "movie" || type === "movies") {
            await queryRunner.manager.update(
              CollectionMovieModel,
              { collectionId: validatedId, movieId: item.id },
              { customOrder: newOrder }
            );
          } else if (type === "series" || type === "show" || type === "shows") {
            await queryRunner.manager.update(
              CollectionSeriesModel,
              { collectionId: validatedId, seriesId: item.id },
              { customOrder: newOrder }
            );
          } else if (type === "album" || type === "albums") {
            await queryRunner.manager.update(
              CollectionAlbumModel,
              { collectionId: validatedId, albumId: item.id },
              { customOrder: newOrder }
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
    }, `Failed to reorder content for collection ${collectionId}`);
  }
}
