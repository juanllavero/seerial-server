import { Album } from "@/api/v0/albums/domain/Album";
import { Collection } from "@/api/v0/collections/domain/Collection";
import { Movie } from "@/api/v0/movies/domain/Movie";
import { Series } from "@/api/v0/series/domain/Series";
import {
  librariesRepo,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import ApiError from "@/data/ApiError";
import { LibraryItem } from "@/data/interfaces/Media";
import { clearLibrary, getCollectionItemsKey } from "@/file-search/utils/utils";
import { imageExtensions } from "@/utils/utils";
import * as fs from "fs/promises";
import { existsSync } from "original-fs";
import path from "path";
import { MediaManager } from "../../../../../managers/MediaManager";
import { GetLibrariesUseCase } from "../usecases/GetLibrariesUseCase";
import { GetLibraryUseCase } from "../usecases/GetLibraryUseCase";

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

      //const collectionData = collection.get({ plain: true });
      const collectionData = collection;

      // if (!collectionData.LibraryCollection) {
      //   throw new ApiError(404, messages.errors.notFound.library);
      // }

      const collectionImages = await this.getCollectionImages(collection, type);

      unifiedContent.push({
        type: "collection",
        //order: collectionData.LibraryCollection.customOrder,
        data: {
          id: collectionData.id,
          title: collectionData.title,
          images: collectionImages,
          // posterSrc:
          //   collectionData.posterSrc ??
          //   (type === "Movies" &&
          //     collectionData.movies &&
          //     collectionData.movies.length === 1)
          //     ? collectionData.movies[0].coverSrc ?? undefined
          //     : collectionData.shows && collectionData.shows.length === 1
          //     ? collectionData.shows[0].coverSrc ?? undefined
          //     : undefined,
          musicPosterSrc:
            collectionData.musicPosterSrc ??
            (collectionData.albums && collectionData.albums.length === 1)
              ? collectionData.albums[0].coverSrc ?? undefined
              : undefined,
          numberOfItems:
            type === "Movies"
              ? collectionData.movies.length
              : type === "Shows" || type === "Series"
              ? collectionData.shows.length
              : type === "Music"
              ? collectionData.albums.length
              : 0,
        },
      });
    }

    for (const item of itemsNotInCollections) {
      const itemType = getCollectionItemsKey(type);
      const remainingItems =
        getCollectionItemsKey(type) === "movies"
          ? await MediaManager.countRemainingVideos(item.data.id, userId)
          : getCollectionItemsKey(type) === "shows"
          ? await MediaManager.countRemainingEpisodes(item.data.id, userId)
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
              posterSrc: item.data.coverSrc,
            }
          : item,
        remainingItems,
      });
    }

    //unifiedContent.sort((a, b) => a.order - b.order);
    //return unifiedContent;
    return [];
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
      if (baseFolder !== null && existsSync(baseFolder)) {
        try {
          const filesInFolder = await fs.readdir(baseFolder);

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
          console.error(`Error reading folder ${baseFolder}:`, error);
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
