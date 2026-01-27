import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { CollectionModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionModel";
import { EpisodeModel } from "@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { SequelizeManager } from "@/api/v1/shared/infrastructure/persistence/SequelizeManager";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { LibraryItem, LibraryTypes } from "@/data/interfaces/Media";
import logger from "@/utils/logger";
import { v4 as uuidv4 } from "uuid";
import { LibrariesRepositoryPort } from "../../../application/ports/LibrariesRepositoryPort";
import { Library } from "../../../domain/Library";
import { LibraryCollectionModel } from "../models/LibraryCollectionModel";
import { LibraryModel } from "../models/LibraryModel";

const libraryRepositoryLogger = logger.child({
  category: "Library Repository",
});

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

  async getContent(libraryId: string, userId: string): Promise<LibraryItem[]> {
    const library = await LibraryModel.findOne({
      where: { id: libraryId },
      include: [
        {
          model: SeriesModel,
          as: "series",
          order: [["order", "ASC"]],
          include: [
            {
              model: SeasonModel,
              as: "seasons",
              include: [
                {
                  model: EpisodeModel,
                  as: "episodes",
                  include: [
                    {
                      model: WatchListModel,
                      as: "watchLists",
                      where: { userId },
                      required: false,
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: MovieModel,
          as: "movies",
          order: [["order", "ASC"]],
          include: [
            {
              model: VideoModel,
              as: "videos",
            },
          ],
        },
        {
          model: AlbumModel,
          as: "albums",
          order: [["order", "ASC"]],
        },
        {
          model: CollectionModel,
          as: "collections",
          order: [["order", "ASC"]],
          include: [
            {
              model: MovieModel,
              as: "movies",
            },
            {
              model: SeriesModel,
              as: "shows",
            },
            {
              model: AlbumModel,
              as: "albums",
            },
            {
              model: LibraryCollectionModel,
              as: "LibraryCollection",
            },
          ],
        },
      ],
    });

    if (!library) return [];

    const type = library.type;
    const items: LibraryItem[] = [];

    // Get collections first
    const collections = library.collections || [];
    for (const collection of collections) {
      const years = this.calculateYearsForCollection(collection);
      const numberOfItems =
        collection.movies?.length +
          collection.shows?.length +
          collection.albums?.length || 0;

      items.push({
        id: collection.id,
        title: collection.title,
        years: years,
        coverSrc: collection.posterSrc || collection.musicPosterSrc || "",
        numberOfItems,
        order:
          collection.LibraryCollection?.find((lc) => lc.libraryId === libraryId)
            ?.customOrder || 0,
        watched: false, // Collections don't have watch state
        remainingItems: 0,
        analyzingFiles: false, // Collections don't have analyzingFiles
        type: "collection",
      });
    }

    // Get items that don't belong to any collection
    const collectionMovieIds = new Set(
      collections.flatMap((c) => c.movies?.map((m) => m.id) || [])
    );
    const collectionSeriesIds = new Set(
      collections.flatMap((c) => c.shows?.map((s) => s.id) || [])
    );
    const collectionAlbumIds = new Set(
      collections.flatMap((c) => c.albums?.map((a) => a.id) || [])
    );

    if (type === LibraryTypes.MOVIES) {
      for (const movie of library.movies || []) {
        if (collectionMovieIds.has(movie.id)) continue; // Skip if belongs to collection

        const years = movie.year || "-";
        const numberOfItems = movie.videos?.length || 0;

        items.push({
          id: movie.id,
          title: movie.name,
          years: years,
          coverSrc: movie.coverSrc,
          numberOfItems,
          order: movie.order,
          watched: false,
          remainingItems: 0,
          analyzingFiles: movie.analyzingFiles,
          type: "movie",
        });
      }
    } else if (type === LibraryTypes.SHOWS) {
      for (const series of library.series || []) {
        if (collectionSeriesIds.has(series.id)) continue; // Skip if belongs to collection

        const years = this.calculateYearsForSeries(series);
        const watched = this.calculateWatchedState(series, userId);
        const remainingItems = this.calculateRemainingEpisodes(series, userId);

        items.push({
          id: series.id,
          title: series.name,
          years: years,
          coverSrc: series.coverSrc,
          numberOfItems: 0,
          order: series.order,
          watched,
          remainingItems,
          analyzingFiles: series.analyzingFiles,
          type: "series",
        });
      }
    } else if (type === LibraryTypes.MUSIC) {
      for (const album of library.albums || []) {
        if (collectionAlbumIds.has(album.id)) continue; // Skip if belongs to collection

        const years = album.year || "-";

        items.push({
          id: album.id,
          title: album.title,
          years: years,
          coverSrc: album.coverSrc,
          numberOfItems: 0,
          order: album.order,
          watched: false,
          remainingItems: 0,
          analyzingFiles: false,
          type: "album",
        });
      }
    }

    return items.sort((a, b) => a.order - b.order);
  }

  private calculateYearsForCollection(collection: any): string {
    const years: number[] = [];

    // Add movie years
    if (collection.movies) {
      for (const movie of collection.movies) {
        if (movie.year) {
          years.push(parseInt(movie.year));
        }
      }
    }

    // Add series years
    if (collection.shows) {
      for (const series of collection.shows) {
        if (series.seasons) {
          for (const season of series.seasons) {
            if (season.year) {
              years.push(parseInt(season.year));
            }
          }
        }
      }
    }

    // Add album years
    if (collection.albums) {
      for (const album of collection.albums) {
        if (album.year) {
          years.push(parseInt(album.year));
        }
      }
    }

    if (years.length === 0) return "-";

    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);

    return minYear === maxYear ? minYear.toString() : `${minYear}-${maxYear}`;
  }

  private calculateYearsForSeries(series: any): string {
    if (!series.seasons || series.seasons.length === 0) return "-";

    const years = series.seasons
      .map((season: any) => season.year)
      .filter((year: string) => year && year.trim() !== "");

    if (years.length === 0) return "-";

    const minYear = Math.min(...years.map((y: string) => parseInt(y)));
    const maxYear = Math.max(...years.map((y: string) => parseInt(y)));

    return minYear === maxYear ? minYear.toString() : `${minYear}-${maxYear}`;
  }

  private calculateWatchedState(series: any, userId: string): boolean {
    if (!series.seasons) return false;

    for (const season of series.seasons) {
      if (!season.episodes) continue;

      for (const episode of season.episodes) {
        const watchedEpisode = episode.watchLists?.find(
          (wl: any) => wl.userId === userId
        );
        if (watchedEpisode) return true;
      }
    }

    return false;
  }

  private calculateRemainingEpisodes(series: any, userId: string): number {
    if (!series.seasons) return 0;

    let totalEpisodes = 0;
    let watchedEpisodes = 0;

    for (const season of series.seasons) {
      if (!season.episodes) continue;

      totalEpisodes += season.episodes.length;

      for (const episode of season.episodes) {
        const watchedEpisode = episode.watchLists?.find(
          (wl: any) => wl.userId === userId
        );
        if (watchedEpisode) watchedEpisodes++;
      }
    }

    return totalEpisodes - watchedEpisodes;
  }

  async getById(id: string) {
    try {
      const library = await LibraryModel.findByPk(id);

      if (!library) {
        return null;
      }

      return library.toJSON() as Library;
    } catch (error: any) {
      logger.error(error, "Error fetching library");
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
      libraryRepositoryLogger.error("No library data provided");
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
          attempts++;
          continue;
        }

        const newLibrary = new LibraryModel(libraryData);
        await newLibrary.save();
        return newLibrary.toJSON() as Library;
      } catch (error) {
        libraryRepositoryLogger.error(
          error,
          `Error trying to create library (attempt ${
            attempts + 1
          }/${maxAttempts})`
        );
        attempts++;
        continue;
      }
    }

    libraryRepositoryLogger.error(
      "Failed to create library after multiple attempts"
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
      logger.error(error, "Error fetching library");
      return null;
    }
  }
}
