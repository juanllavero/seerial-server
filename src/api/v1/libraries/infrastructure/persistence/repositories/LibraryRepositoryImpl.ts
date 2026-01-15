import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { EpisodeModel } from "@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel";
import { LibraryManager } from "@/api/v1/libraries/application/services/LibraryManager";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { SequelizeManager } from "@/managers/SequelizeManager";
import { v4 as uuidv4 } from "uuid";
import { LibrariesRepositoryPort } from "../../../application/ports/LibrariesRepositoryPort";
import { Library } from "../../../domain/Library";
import { LibraryCollectionModel } from "../models/LibraryCollectionModel";
import { LibraryModel } from "../models/LibraryModel";

export class LibrariesRepositoryImpl
  extends BaseRepository
  implements LibrariesRepositoryPort
{
  async getAll() {
    return LibraryModel.findAll({
      order: [["order", "ASC"]],
    }).then((libraries) =>
      libraries.map((library) => library.toJSON() as Library)
    );
  }

  async getContent(
    libraryId: string,
    type: string,
    userId: string,
    flat?: string
  ) {
    // TODO: Change this function to not use LibraryManager
    return await LibraryManager.getLibraryContent(
      libraryId,
      type,
      userId,
      flat === "true" ? true : false
    );
  }

  async getById(id: string) {
    try {
      const library = await LibraryModel.findByPk(id);

      if (!library) {
        return null;
      }

      return library.toJSON() as Library;
    } catch (error: any) {
      console.log(`Error fetching library: ${error.message}`);
      return null;
    }
  }

  async getByAlbumId(albumId: string) {
    const validatedId = this.validateId(albumId, "Album ID");

    return this.handleRepositoryError(async () => {
      const album = await AlbumModel.findByPk(validatedId, {
        attributes: ["libraryId"],
      });

      if (!album || !album.libraryId) {
        return null;
      }

      const library = await LibraryModel.findByPk(album.libraryId);

      if (!library) {
        return null;
      }

      return library.toJSON() as Library;
    }, `Failed to find library by album ID ${albumId}`);
  }

  async getByMovieId(movieId: string) {
    const validatedId = this.validateId(movieId, "Movie ID");

    return this.handleRepositoryError(async () => {
      const movie = await MovieModel.findByPk(validatedId, {
        attributes: ["libraryId"],
      });

      if (!movie || !movie.libraryId) {
        return null;
      }

      const library = await LibraryModel.findByPk(movie.libraryId);

      if (!library) {
        return null;
      }

      return library.toJSON() as Library;
    }, `Failed to find library by movie ID ${movieId}`);
  }

  async getBySeriesId(seriesId: string) {
    const validatedId = this.validateId(seriesId, "Series ID");

    return this.handleRepositoryError(async () => {
      const series = await SeriesModel.findByPk(validatedId, {
        attributes: ["libraryId"],
      });

      if (!series || !series.libraryId) {
        return null;
      }

      const library = await LibraryModel.findByPk(series.libraryId);

      if (!library) {
        return null;
      }

      return library.toJSON() as Library;
    }, `Failed to find library by series ID ${seriesId}`);
  }

  async getBySeasonId(seasonId: string) {
    const validatedId = this.validateId(seasonId, "Season ID");

    return this.handleRepositoryError(async () => {
      const season = await SeasonModel.findByPk(validatedId, {
        attributes: ["libraryId"],
      });

      if (!season) {
        return null;
      }

      const series = await SeriesModel.findByPk(validatedId, {
        attributes: ["libraryId"],
      });

      if (!series || !series.libraryId) {
        return null;
      }

      const library = await LibraryModel.findByPk(series.libraryId);

      if (!library) {
        return null;
      }

      return library.toJSON() as Library;
    }, `Failed to find library by season ID ${seasonId}`);
  }

  async getByVideoId(videoId: string) {
    const video = await VideoModel.findByPk(videoId);

    if (!video) return null;

    let element: EpisodeModel | MovieModel | null = video.episodeId
      ? await EpisodeModel.findByPk(video.episodeId)
      : await MovieModel.findByPk(video.movieId ?? video.extraId ?? "");

    if (!element) return null;

    if (element instanceof EpisodeModel) {
      const season = await SeasonModel.findByPk(element.seasonId);

      if (!season) return null;

      const series = await SeriesModel.findByPk(season.seriesId);

      if (!series) return null;

      const library = await LibraryModel.findByPk(series.libraryId);
      return library ? library.toJSON() : null;
    }

    const library = await LibraryModel.findByPk(element.libraryId);
    return library ? library.toJSON() : null;
  }

  async reorder(orderedLibrariesIds: string[]): Promise<boolean> {
    if (!SequelizeManager.sequelize) {
      return false;
    }

    const t = await SequelizeManager.sequelize.transaction();

    try {
      await LibraryModel.update(
        { order: 9999 },
        {
          where: {},
          transaction: t,
        }
      );

      for (const [index, libraryId] of orderedLibrariesIds.entries()) {
        const newOrder = index;

        await LibraryModel.update(
          { order: newOrder },
          {
            where: { id: libraryId },
            transaction: t,
          }
        );
      }

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      return false;
    }
  }

  async reorderItems(
    libraryId: string,
    orderedItems: { id: string; type: string }[]
  ) {
    if (!SequelizeManager.sequelize) {
      return false;
    }

    const t = await SequelizeManager.sequelize.transaction();

    try {
      const tempOrder = 9999;

      // Get the library
      const library = await LibraryModel.findByPk(libraryId);
      if (!library) {
        await t.rollback();
        return false;
      }

      // Restore the order of the collections
      await LibraryCollectionModel.update(
        { customOrder: tempOrder },
        { where: { libraryId: libraryId }, transaction: t }
      );

      // Restore the order of the items
      if (library.type === "Movies") {
        await MovieModel.update(
          { order: tempOrder },
          { where: { libraryId: libraryId }, transaction: t }
        );
      } else if (library.type === "Shows") {
        await SeriesModel.update(
          { order: tempOrder },
          { where: { libraryId: libraryId }, transaction: t }
        );
      } else if (library.type === "Music") {
        await AlbumModel.update(
          { order: tempOrder },
          { where: { libraryId: libraryId }, transaction: t }
        );
      }

      // Assign the new order to the items
      for (let i = 0; i < orderedItems.length; i++) {
        const item = orderedItems[i];
        const newOrder = i;

        if (item.type === "collection") {
          await LibraryCollectionModel.update(
            { customOrder: newOrder },
            {
              where: { libraryId: libraryId, collectionId: item.id },
              transaction: t,
            }
          );
        } else if (item.type === "movies") {
          await MovieModel.update(
            { order: newOrder },
            { where: { libraryId: libraryId, id: item.id }, transaction: t }
          );
        } else if (item.type === "shows") {
          await SeriesModel.update(
            { order: newOrder },
            { where: { libraryId: libraryId, id: item.id }, transaction: t }
          );
        } else if (item.type === "albums") {
          await AlbumModel.update(
            { order: newOrder },
            { where: { libraryId: libraryId, id: item.id }, transaction: t }
          );
        }
      }

      await t.commit();
      return true;
    } catch (error) {
      await t.rollback();
      return false;
    }
  }

  async create(library: Partial<Library>) {
    if (!library) {
      console.error("Error: No library data provided");
      return null;
    }

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      const libraryData = {
        ...library,
        id: uuidv4().split("-")[0],
      };

      try {
        // Verifica si el id ya existe
        const existingLibrary = await LibraryModel.findOne({
          where: { id: libraryData.id },
        });
        if (existingLibrary) {
          console.log(`Colisión de UUID: ${libraryData.id}. Reintentando...`);
          attempts++;
          continue;
        }

        const newLibrary = new LibraryModel(libraryData);
        await newLibrary.save();
        return newLibrary.toJSON() as Library;
      } catch (error) {
        console.error(
          `Error al intentar guardar la librería (intento ${
            attempts + 1
          }/${maxAttempts}):`,
          error
        );
        attempts++;
        continue;
      }
    }

    console.error(
      "Error: No se pudo generar un UUID único después de varios intentos"
    );
    return null;
  }

  async update(id: string, data: Partial<Library>): Promise<Library> {
    const [affectedCount] = await LibraryModel.update(data, {
      where: { id },
    });

    if (affectedCount === 0) {
      throw new ApiError(404, messages.errors.notFound.library);
    }

    const updatedLibrary = await this.getById(id);

    if (!updatedLibrary) {
      throw new ApiError(
        500,
        `Failed to retrieve updated Library with ID ${id}`
      );
    }

    return updatedLibrary;
  }

  async delete(id: string): Promise<boolean> {
    const affectedCount = await LibraryModel.destroy({
      where: { id },
    });

    if (affectedCount === 0) {
      throw new Error(`Library with ID ${id} not found`);
    }

    return true;
  }

  async addAnalyzedFile(
    libraryId: string,
    file: string,
    videoId: string
  ): Promise<Library> {
    const library = await this.getLibraryModel(libraryId);

    if (!library) {
      throw new ApiError(404, messages.errors.notFound.library);
    }

    await library.addAnalyzedFile(file, videoId);

    await library.save();

    return library.toJSON() as Library;
  }

  async removeAnalyzedFile(libraryId: string, file: string): Promise<Library> {
    const library = await this.getLibraryModel(libraryId);

    if (!library) {
      throw new ApiError(404, messages.errors.notFound.library);
    }

    await library.removeAnalyzedFile(file);

    await library.save();

    return library.toJSON() as Library;
  }

  async addAnalyzedFolder(
    libraryId: string,
    folder: string,
    videoId: string
  ): Promise<Library> {
    const library = await this.getLibraryModel(libraryId);

    if (!library) {
      throw new ApiError(404, messages.errors.notFound.library);
    }

    await library.addAnalyzedFolder(folder, videoId);

    await library.save();

    return library.toJSON() as Library;
  }

  async removeAnalyzedFolder(
    libraryId: string,
    folder: string
  ): Promise<Library> {
    const library = await this.getLibraryModel(libraryId);

    if (!library) {
      throw new ApiError(404, messages.errors.notFound.library);
    }

    await library.removeAnalyzedFolder(folder);

    await library.save();

    return library.toJSON() as Library;
  }

  private async getLibraryModel(id: string): Promise<LibraryModel | null> {
    try {
      const library = await LibraryModel.findByPk(id);

      if (!library) {
        return null;
      }

      return library;
    } catch (error: any) {
      console.log(`Error fetching library: ${error.message}`);
      return null;
    }
  }
}
