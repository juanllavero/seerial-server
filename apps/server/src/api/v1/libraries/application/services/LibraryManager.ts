import fs from 'node:fs';
import * as fsPromises from 'node:fs/promises';
import path from 'node:path';
import { type LibraryType, LibraryTypes } from '@seerial/domain';
import type { Collection } from '@/api/v1/collections/domain/Collection';
import type { CollectionModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionModel';
import {
  fileSystemService,
  imageProcessingService,
  librariesRepo,
  notificationService,
  useCases,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { clearLibrary } from '@/api/v1/shared/infrastructure/services/FileSearchService';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import { imageExtensions } from '@/utils/constants';
import logger from '@/utils/logger';
import { GetLibrariesUseCase } from '../usecases/GetLibrariesUseCase';
import { GetLibraryUseCase } from '../usecases/GetLibraryUseCase';

const libraryManagerLogger = logger.child({ category: 'Library Manager' });

type CollectionImageSourceItem = {
  folder?: string | null;
  coverSrc?: string | null;
};

/**
 * Fetches all libraries.
 */
export const getAllLibraries = async () => {
  const useCase = new GetLibrariesUseCase(librariesRepo);
  return await useCase.execute();
};

/**
 * Fetches a single library by its ID.
 */
export const getLibraryById = async (id: string) => {
  const useCase = new GetLibraryUseCase(librariesRepo);
  const library = await useCase.execute(id);
  if (!library) {
    throw new NotFoundException(messages.errors.notFound.library);
  }
  return library;
};

export const getCollectionImages = async (
  collection: CollectionModel,
  type: LibraryType,
): Promise<{
  poster: string | null;
  background: string | null;
  images: string[];
}> => {
  const coverSrc = resolveCoverSource(collection, type);
  const backgroundSrc = collection.backgroundSrc !== '' ? collection.backgroundSrc : '';

  const items = getCollectionItemsByType(collection, type);
  const { posterPath, backgroundPath } = await findCollectionImagesInCollectionRoot(items);
  const resolvedPoster = posterPath ?? (coverSrc !== '' ? coverSrc : null);
  const resolvedBackground = backgroundPath ?? (backgroundSrc !== '' ? backgroundSrc : null);
  const imagePaths = !resolvedPoster ? getFallbackImagePaths(items) : [];

  return {
    poster: resolvedPoster,
    background: resolvedBackground,
    images: imagePaths,
  };
};

const resolveCoverSource = (collection: CollectionModel, type: LibraryType): string => {
  if (type === LibraryTypes.MUSIC && collection.musicPosterSrc !== '') {
    return collection.musicPosterSrc;
  }

  return collection.posterSrc !== '' ? collection.posterSrc : '';
};

const getCollectionItemsByType = (
  collection: CollectionModel,
  type: LibraryType,
): CollectionImageSourceItem[] => {
  switch (type) {
    case LibraryTypes.MOVIES:
      return collection.collectionMovies.map((movie) => movie.movie);
    case LibraryTypes.SHOWS:
      return collection.collectionSeries.map((series) => series.series);
    case LibraryTypes.MUSIC:
      return collection.collectionAlbums.map((album) => album.album);
    default:
      return [];
  }
};

const findCollectionImagesInCollectionRoot = async (
  items: CollectionImageSourceItem[],
): Promise<{ posterPath: string | null; backgroundPath: string | null }> => {
  const itemFolder = items.find((item) => Boolean(item.folder))?.folder;
  const collectionRootFolder = itemFolder ? path.dirname(itemFolder) : null;

  if (!collectionRootFolder || !fs.existsSync(collectionRootFolder)) {
    return { posterPath: null, backgroundPath: null };
  }

  try {
    const filesInFolder = await fsPromises.readdir(collectionRootFolder);
    let posterPath: string | null = null;
    let backgroundPath: string | null = null;

    for (const file of filesInFolder) {
      const extension = path.extname(file).toLowerCase();
      if (!imageExtensions.includes(extension)) continue;

      const fileNameWithoutExt = path.parse(file).name.toLowerCase();
      if (fileNameWithoutExt === 'poster') {
        posterPath = path.join(collectionRootFolder, file);
      } else if (fileNameWithoutExt === 'background') {
        backgroundPath = path.join(collectionRootFolder, file);
      }
    }

    return { posterPath, backgroundPath };
  } catch (error) {
    libraryManagerLogger.error(error, `Error reading folder ${collectionRootFolder}`);
    return { posterPath: null, backgroundPath: null };
  }
};

const getFallbackImagePaths = (items: CollectionImageSourceItem[]): string[] => {
  return items
    .map((item) => item.coverSrc)
    .filter((coverSrc): coverSrc is string => Boolean(coverSrc))
    .slice(0, 4);
};

/**
 * Resolves collection posterSrc and backgroundSrc.
 * The poster could be a collage of the covers of the items in the collection.
 * If the collage has not been generated yet, it is created in the background
 * and clients are notified via WebSocket (MUTATE_COLLECTION) when it is ready.
 */
export const resolveCollectionImages = async (
  collection: CollectionModel,
  libraryId: string,
  libraryType: LibraryType,
): Promise<{
  poster: string | null;
  background: string | null;
}> => {
  const collectionImages = await getCollectionImages(collection, libraryType);

  if (collectionImages.images.length === 0) {
    return {
      poster: collectionImages.poster,
      background: collectionImages.background,
    };
  }

  // Collage needed but not yet generated — return current state immediately
  // and generate the collage in the background.
  generateCollageInBackground(collection, libraryId, libraryType, collectionImages);

  return {
    poster: collectionImages.poster,
    background: collectionImages.background,
  };
};

const generateCollageInBackground = (
  collection: CollectionModel,
  libraryId: string,
  libraryType: LibraryType,
  collectionImages: { poster: string | null; background: string | null; images: string[] },
): void => {
  (async () => {
    try {
      const ratio = libraryType === LibraryTypes.MUSIC ? 'square' : 'poster';
      const collageBuffer = await imageProcessingService.generateCollage(
        collectionImages.images,
        ratio,
        libraryType,
      );

      const outputDir = fileSystemService.getExternalPath(
        fileSystemService.join('resources', 'img', 'collages', collection.id),
      );
      fileSystemService.createFolder(outputDir);
      const fileName = `collage-${collection.id}-${libraryId}.jpg`;
      const filePath = fileSystemService.join(outputDir, fileName);
      await fileSystemService.writeImage(filePath, collageBuffer);

      const collectionPoster = fileSystemService.join('img', 'collages', collection.id, fileName);

      if (libraryType === LibraryTypes.MUSIC) {
        collection.musicPosterSrc = collectionPoster;
      } else {
        collection.posterSrc = collectionPoster;
      }

      if (collectionImages.background) {
        collection.backgroundSrc = collectionImages.background;
      }

      await collection.save();

      notificationService.mutateCollection(collection as unknown as Collection);
    } catch (error) {
      libraryManagerLogger.error(
        error,
        `Failed to generate collage in background for collection ${collection.id} (library ${libraryId})`,
      );
    }
  })();
};

/**
 * Starts a background scan of a library's files.
 */
export const startLibraryScan = async (libraryId: string) => {
  const library = await getLibraryById(libraryId); // reuses own method
  await clearLibrary(libraryId);
  // This is a fire-and-forget operation, so no await is needed here.
  useCases.scanLibrary().execute(library, false);
  return `Scan initiated for library: ${library.name}`;
};
