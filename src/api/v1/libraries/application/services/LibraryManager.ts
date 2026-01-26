import { Album } from "@/api/v1/albums/domain/Album";
import { Collection } from "@/api/v1/collections/domain/Collection";
import { Movie } from "@/api/v1/movies/domain/Movie";
import { Series } from "@/api/v1/series/domain/Series";
import {
  librariesRepo,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import {
  clearLibrary,
  getCollectionItemsKey,
} from "@/api/v1/shared/infrastructure/services/FileSearchService";
import { MediaService } from "@/api/v1/shared/infrastructure/services/MediaService";
import ApiError from "@/data/ApiError";
import { LibraryItem } from "@/data/interfaces/Media";
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
      throw new ApiError(404, `Library with ID ${id} not found.`);
    }
    return library;
  }

  /**
   * Fetches and structures the content of a library, combining collections and individual items.
   * This method is highly complex and involves significant data aggregation.
   */
  public static async getLibraryContent(
    libraryId: string,
    type: string,
    userId: string,
    flat?: boolean
  ): Promise<LibraryItem[]> {
    const [collections, allItems] = await Promise.all([
      useCases.getAllCollectionsInLibrary().execute(libraryId),
      useCases
        .getLibraryContent()
        .execute(libraryId, type, userId, flat ? "true" : "false"),
    ]);

    const itemIdsInCollections = new Set<string>();
    collections.forEach((collection) => {
      const itemsKey = getCollectionItemsKey(type);
      const items = (collection[itemsKey] as { id: string }[]) || [];
      items.forEach((item) => itemIdsInCollections.add(item.id));
    });

    const itemsNotInCollections = allItems.filter(
      (item) => !itemIdsInCollections.has(item.data.id)
    );

    const unifiedContent = [];

    for (const collection of collections) {
      if (
        (!collection.shows || collection.shows.length === 0) &&
        (!collection.movies || collection.movies.length === 0) &&
        (!collection.albums || collection.albums.length === 0)
      ) {
        continue;
      }

      const collectionImages = await this.getCollectionImages(collection, type);

      unifiedContent.push({
        type: "collection",
        order: (collection as any).LibraryCollection?.customOrder ?? 0,
        data: {
          id: collection.id,
          title: collection.title,
          images: collectionImages,
          musicPosterSrc:
            collection.musicPosterSrc ??
            (collection.albums && collection.albums.length === 1)
              ? collection.albums[0].coverSrc ?? undefined
              : undefined,
          numberOfItems:
            type === "Movies"
              ? collection.movies.length
              : type === "Shows" || type === "Series"
              ? collection.shows.length
              : type === "Music"
              ? collection.albums.length
              : 0,
        },
      });
    }

    for (const item of itemsNotInCollections) {
      const itemType = getCollectionItemsKey(type);
      const remainingItems =
        getCollectionItemsKey(type) === "movies"
          ? await MediaService.countRemainingVideos(item.data.id, userId)
          : getCollectionItemsKey(type) === "shows"
          ? await MediaService.countRemainingEpisodes(item.data.id, userId)
          : 0;
      unifiedContent.push({
        type: getCollectionItemsKey(type),
        order: item.order || 0,
        data: flat
          ? {
              id: item.data.id,
              year:
                itemType === "albums"
                  ? (item.data as Album).year
                  : itemType === "movies"
                  ? (item.data as Movie).year
                  : itemType === "shows"
                  ? (item.data as Series).year
                  : undefined,
              title:
                itemType === "albums"
                  ? (item.data as Album).title
                  : itemType === "movies"
                  ? (item.data as Movie).name
                  : (item.data as Series).name,
              posterSrc: (item.data as any).coverSrc,
            }
          : item.data,
        remainingItems,
      });
    }

    unifiedContent.sort((a, b) => a.order - b.order);
    return unifiedContent;
  }

  private static async getCollectionImages(
    collection: Collection,
    type: string
  ) {
    if (!collection) {
      return {
        images: [],
      };
    }

    let items: any[] = [];

    if (type === "Movies") {
      items = collection.movies || [];
    } else if (type === "Shows") {
      items = collection.shows || [];
    } else if (type === "Music") {
      items = collection.albums || [];
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
