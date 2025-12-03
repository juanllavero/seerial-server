import { AlbumModel } from "@/api/v0/albums/infrastructure/persistence/models/AlbumModel";
import { LibraryCollectionModel } from "@/api/v0/libraries/infrastructure/persistence/models/LibraryCollectionModel";
import { LibraryModel } from "@/api/v0/libraries/infrastructure/persistence/models/LibraryModel";
import { MovieModel } from "@/api/v0/movies/infrastructure/persistence/models/MovieModel";
import { SeriesModel } from "@/api/v0/series/infrastructure/persistence/models/SeriesModel";
import { getCollectionItemsKey, getItemModel } from "@/file-search/utils/utils";
import { SequelizeManager } from "@/managers/SequelizeManager";
import { v4 as uuidv4 } from "uuid";
import { ReorderItemDTO } from "../../../application/dtos/CollectionDTOs";
import { CollectionsRepositoryPort } from "../../../application/ports/CollectionRepositoryPort";
import { Collection } from "../../../domain/Collection";
import { CollectionAlbumModel } from "../models/CollectionAlbum";
import { CollectionModel } from "../models/CollectionModel";
import { CollectionMovieModel } from "../models/CollectionMovie";
import { CollectionSeriesModel } from "../models/CollectionSeries";

export class CollectionsRepositoryImpl implements CollectionsRepositoryPort {
  async getAll(libraryId: string): Promise<Collection[]> {
    const data = await LibraryModel.findByPk(libraryId, {
      include: [
        {
          model: CollectionModel,
          as: "collections",
        },
      ],
    });

    return data?.collections.map((d) => d.toJSON()) || [];
  }

  async getById(id: string): Promise<Collection | null> {
    const data = await CollectionModel.findByPk(id, {
      include: [
        {
          model: SeriesModel,
          as: "shows",
          through: {
            attributes: ["custom_order"],
          },
        },
        {
          model: MovieModel,
          as: "movies",
          through: {
            attributes: ["custom_order"],
          },
        },
        {
          model: AlbumModel,
          as: "albums",
          through: {
            attributes: ["custom_order"],
          },
        },
      ],
    });
    return data ? data.toJSON() : null;
  }

  async getByLibraryId(libraryId: string, type: string): Promise<Collection[]> {
    const collectionItemsKey = getCollectionItemsKey(type);
    const ItemModel = getItemModel(type);

    const data = await LibraryModel.findByPk(libraryId, {
      include: [
        {
          model: CollectionModel,
          as: "collections",
          include: [
            {
              model: ItemModel,
              as: collectionItemsKey,
              attributes: ["id", "coverSrc"],
            },
          ],
          through: {
            attributes: ["customOrder"],
          },
        },
      ],
    }).then((library) => library?.collections || []);
    return data.map((d) => d.toJSON());
  }

  async add(collection: Partial<Collection>): Promise<Collection | null> {
    const existing = collection.title
      ? await CollectionModel.findOne({ where: { title: collection.title } })
      : null;

    if (existing) return existing.toJSON();

    const newData = { ...collection, id: uuidv4().split("-")[0] };
    const created = await CollectionModel.create(newData);
    return created.toJSON();
  }

  async update(id: string, data: Partial<Collection>): Promise<Collection> {
    const [count] = await CollectionModel.update(data, { where: { id } });
    if (count === 0) throw new Error(`Collection ${id} not found`);
    const updated = await CollectionModel.findByPk(id);
    if (!updated) throw new Error(`Failed to retrieve collection ${id}`);
    return updated.toJSON();
  }

  async delete(id: string): Promise<boolean> {
    const count = await CollectionModel.destroy({ where: { id } });
    if (count === 0) throw new Error(`Collection ${id} not found`);
    return true;
  }

  async addAlbum(collectionId: string, albumId: string): Promise<void> {
    await CollectionAlbumModel.findOrCreate({
      where: { collectionId, albumId },
      defaults: { id: uuidv4().split("-")[0] },
    });
  }

  async addMovie(collectionId: string, movieId: string): Promise<void> {
    await CollectionMovieModel.findOrCreate({
      where: { collectionId, movieId },
      defaults: { id: uuidv4().split("-")[0] },
    });
  }

  async addSeries(collectionId: string, seriesId: string): Promise<void> {
    await CollectionSeriesModel.findOrCreate({
      where: { collectionId, seriesId },
      defaults: { id: uuidv4().split("-")[0] },
    });
  }

  async addLibrary(libraryId: string, collectionId: string): Promise<void> {
    await LibraryCollectionModel.findOrCreate({
      where: { libraryId, collectionId },
      defaults: { id: uuidv4().split("-")[0] },
    });
  }

  async removeSeries(collectionId: number, seriesId: number): Promise<boolean> {
    const affectedCount = await CollectionSeriesModel.destroy({
      where: { collectionId, seriesId },
    });

    if (affectedCount === 0) {
      throw new Error(
        `CollectionSeries with collectionId ${collectionId} and seriesId ${seriesId} not found`
      );
    }

    return true;
  }

  async removeMovie(collectionId: number, movieId: number): Promise<boolean> {
    const affectedCount = await CollectionMovieModel.destroy({
      where: { collectionId, movieId },
    });

    if (affectedCount === 0) {
      throw new Error(
        `CollectionMovie with collectionId ${collectionId} and movieId ${movieId} not found`
      );
    }

    return true;
  }

  async removeAlbum(collectionId: number, albumId: number): Promise<boolean> {
    const affectedCount = await CollectionAlbumModel.destroy({
      where: { collectionId, albumId },
    });

    if (affectedCount === 0) {
      throw new Error(
        `CollectionAlbum with collectionId ${collectionId} and albumId ${albumId} not found`
      );
    }

    return true;
  }

  async reorderContent(
    collectionId: string,
    orderedItems: ReorderItemDTO[]
  ): Promise<void> {
    if (!SequelizeManager.sequelize) throw new Error("DB not initialized");

    const t = await SequelizeManager.sequelize.transaction();
    try {
      const tempOrder = 9999;

      await CollectionMovieModel.update(
        { customOrder: tempOrder },
        { where: { collectionId }, transaction: t }
      );
      await CollectionSeriesModel.update(
        { customOrder: tempOrder },
        { where: { collectionId }, transaction: t }
      );
      await CollectionAlbumModel.update(
        { customOrder: tempOrder },
        { where: { collectionId }, transaction: t }
      );

      for (const [index, item] of orderedItems.entries()) {
        const newOrder = index;
        const type = (item.type || "").toLowerCase();

        if (type === "movie" || type === "movies") {
          await CollectionMovieModel.update(
            { customOrder: newOrder },
            {
              where: { collectionId, movieId: item.id },
              transaction: t,
            }
          );
        } else if (type === "series" || type === "show" || type === "shows") {
          await CollectionSeriesModel.update(
            { customOrder: newOrder },
            {
              where: { collectionId, seriesId: item.id },
              transaction: t,
            }
          );
        } else if (type === "album" || type === "albums") {
          await CollectionAlbumModel.update(
            { customOrder: newOrder },
            {
              where: { collectionId, albumId: item.id },
              transaction: t,
            }
          );
        }
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  }
}
