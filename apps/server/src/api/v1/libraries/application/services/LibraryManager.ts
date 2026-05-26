import * as fsPromises from 'node:fs/promises';
import path from 'node:path';
import { type LibraryType, LibraryTypes } from '@seerial/domain';
import type { CollectionModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionModel';
import {
  fileSystemService,
  librariesRepo,
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

  const validatedCoverSrc =
    coverSrc !== '' && (await localFileExists(coverSrc)) ? coverSrc : '';

  const resolvedPoster = posterPath ?? (validatedCoverSrc !== '' ? validatedCoverSrc : null);
  const resolvedBackground = backgroundPath ?? (backgroundSrc !== '' ? backgroundSrc : null);
  const imagePaths = !resolvedPoster ? getFallbackImagePaths(items) : [];

  return {
    poster: resolvedPoster,
    background: resolvedBackground,
    images: imagePaths,
  };
};

const localFileExists = async (relativePath: string): Promise<boolean> => {
  if (relativePath.startsWith('http')) return true;
  try {
    await fsPromises.access(fileSystemService.getExternalPath(relativePath));
    return true;
  } catch {
    return false;
  }
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
      return (collection.movies || []) as CollectionImageSourceItem[];
    case LibraryTypes.SHOWS:
      return (collection.series || []) as CollectionImageSourceItem[];
    case LibraryTypes.MUSIC:
      return (collection.albums || []) as CollectionImageSourceItem[];
    default:
      return [];
  }
};

const findCollectionImagesInCollectionRoot = async (
  items: CollectionImageSourceItem[],
): Promise<{ posterPath: string | null; backgroundPath: string | null }> => {
  const itemFolder = items.find((item) => Boolean(item.folder))?.folder;
  const rootFolder = itemFolder ? path.dirname(itemFolder) : null;
  return findImagesInFolder(rootFolder);
};

export const findImagesInFolder = async (
  folderPath: string | undefined | null,
): Promise<{ posterPath: string | null; backgroundPath: string | null }> => {
  if (!folderPath) {
    return { posterPath: null, backgroundPath: null };
  }

  try {
    const filesInFolder = await fsPromises.readdir(folderPath);
    let posterPath: string | null = null;
    let backgroundPath: string | null = null;

    for (const file of filesInFolder) {
      const extension = path.extname(file).toLowerCase();
      if (!imageExtensions.includes(extension)) continue;

      const fileNameWithoutExt = path.parse(file).name.toLowerCase();
      if (fileNameWithoutExt === 'poster') {
        posterPath = path.join(folderPath, file);
      } else if (fileNameWithoutExt === 'background') {
        backgroundPath = path.join(folderPath, file);
      }
    }

    return { posterPath, backgroundPath };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      libraryManagerLogger.error(error, `Error reading folder ${folderPath}`);
    }
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
 * Resolves collection poster, background, and up to 4 item cover images.
 * When no stored poster exists, `images` is populated so the client can
 * render the collage itself.
 */
export const resolveCollectionImages = async (
  collection: CollectionModel,
  libraryType: LibraryType,
): Promise<{
  poster: string | null;
  background: string | null;
  images: string[];
}> => {
  return getCollectionImages(collection, libraryType);
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
