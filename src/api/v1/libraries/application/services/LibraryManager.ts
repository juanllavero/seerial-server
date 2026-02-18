import { CollectionModel } from "@/api/v1/collections/infrastructure/persistence/models/CollectionModel";
import {
  librariesRepo,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { clearLibrary } from "@/api/v1/shared/infrastructure/services/FileSearchService";
import { NotFoundException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { messages } from "@/config/messages";
import { imageExtensions } from "@/utils/constants";
import logger from "@/utils/logger";
import fs from "fs";
import * as fsPromises from "fs/promises";
import path from "path";
import { GetLibrariesUseCase } from "../usecases/GetLibrariesUseCase";
import { GetLibraryUseCase } from "../usecases/GetLibraryUseCase";

const libraryManagerLogger = logger.child({ category: "Library Manager" });

export class LibraryManager {
  /**
   * Fetches all libraries.
   */
  public static async getAllLibraries() {
    const useCase = new GetLibrariesUseCase(librariesRepo);
    return await useCase.execute();
  }

  /**
   * Fetches a single library by its ID.
   */
  public static async getLibraryById(id: string) {
    const useCase = new GetLibraryUseCase(librariesRepo);
    const library = await useCase.execute(id);
    if (!library) {
      throw new NotFoundException(messages.errors.notFound.library);
    }
    return library;
  }

  public static async getCollectionImages(
    collection: CollectionModel,
    type: string
  ): Promise<{
    poster: string | null;
    background: string | null;
    images: string[];
  }> {
    if (!collection) {
      return {
        images: [],
        poster: null,
        background: null,
      };
    }

    let items: any[] = [];

    if (type === "Movies") {
      items = collection.collectionMovies.map((movie) => movie.movie) || [];
    } else if (type === "Shows") {
      items = collection.collectionSeries.map((series) => series.series) || [];
    } else if (type === "Music") {
      items = collection.collectionAlbums.map((album) => album.album) || [];
    }

    let posterPath: string | null = null;
    let backgroundPath: string | null = null;
    let baseFolder: string | null = null;

    // Get the folder of the first item (root folder of the collection in this library)
    if (items.length > 0 && items[0].folder) {
      baseFolder = items[0].folder ?? "";
      if (baseFolder !== null && fs.existsSync(baseFolder)) {
        try {
          const filesInFolder = await fsPromises.readdir(baseFolder);

          // Search poster.ext and background.ext
          for (const file of filesInFolder) {
            const fileNameWithoutExt = path.parse(file).name.toLowerCase();
            if (imageExtensions.includes(path.extname(file).toLowerCase())) {
              if (fileNameWithoutExt === "poster") {
                posterPath = path.join(baseFolder, file);
              } else if (fileNameWithoutExt === "background") {
                backgroundPath = path.join(baseFolder, file);
              }
            }
          }
        } catch (error) {
          libraryManagerLogger.error(
            error,
            `Error reading folder ${baseFolder}`
          );
        }
      }
    }

    let imagePaths: string[] = [];

    // If no poster found, return the first 4 covers
    if (!posterPath && items) {
      imagePaths = items
        .map((item) => item.coverSrc)
        .filter(Boolean)
        .slice(0, 4);
    }

    return {
      poster: posterPath,
      background: backgroundPath,
      images: imagePaths,
    };
  }

  /**
   * Starts a background scan of a library's files.
   */
  public static async startLibraryScan(libraryId: string) {
    const library = await this.getLibraryById(libraryId); // reuses own method
    await clearLibrary(libraryId);
    // This is a fire-and-forget operation, so no await is needed here.
    useCases.scanLibrary().execute(library, false);
    return `Scan initiated for library: ${library.name}`;
  }
}
