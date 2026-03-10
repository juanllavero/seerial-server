import fs from 'fs';
import * as fsPromises from 'fs/promises';
import path from 'path';
import type { CollectionModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionModel';
import {
  fileSystemService,
  imageProcessingService,
  librariesRepo,
  useCases,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import { clearLibrary } from '@/api/v1/shared/infrastructure/services/FileSearchService';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import { type LibraryType, LibraryTypes } from '@/data/interfaces/Media';
import { imageExtensions } from '@/utils/constants';
import logger from '@/utils/logger';
import { GetLibrariesUseCase } from '../usecases/GetLibrariesUseCase';
import { GetLibraryUseCase } from '../usecases/GetLibraryUseCase';

const libraryManagerLogger = logger.child({ category: 'Library Manager' });

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
    type: LibraryType,
  ): Promise<{
    poster: string | null;
    background: string | null;
    images: string[];
  }> {
    const coverSrc =
      type === LibraryTypes.MUSIC && collection.musicPosterSrc !== ''
        ? collection.musicPosterSrc
        : collection.posterSrc !== ''
          ? collection.posterSrc
          : '';

    const backgroundSrc = collection.backgroundSrc !== '' ? collection.backgroundSrc : '';

    if (coverSrc !== '' && backgroundSrc !== '')
      return { poster: coverSrc, background: backgroundSrc, images: [] };

    let items: any[] = [];

    if (type === 'Movies') {
      items = collection.collectionMovies.map((movie) => movie.movie) || [];
    } else if (type === 'Shows') {
      items = collection.collectionSeries.map((series) => series.series) || [];
    } else if (type === 'Music') {
      items = collection.collectionAlbums.map((album) => album.album) || [];
    }

    let posterPath: string | null = null;
    let backgroundPath: string | null = null;
    let baseFolder: string | null = null;

    // Get the folder of the first item (root folder of the collection in this library)
    if (items.length > 0 && items[0].folder) {
      baseFolder = items[0].folder ?? '';
      if (baseFolder !== null && fs.existsSync(baseFolder)) {
        try {
          const filesInFolder = await fsPromises.readdir(baseFolder);

          // Search poster.ext and background.ext
          for (const file of filesInFolder) {
            const fileNameWithoutExt = path.parse(file).name.toLowerCase();
            if (imageExtensions.includes(path.extname(file).toLowerCase())) {
              if (fileNameWithoutExt === 'poster') {
                posterPath = path.join(baseFolder, file);
              } else if (fileNameWithoutExt === 'background') {
                backgroundPath = path.join(baseFolder, file);
              }
            }
          }
        } catch (error) {
          libraryManagerLogger.error(error, `Error reading folder ${baseFolder}`);
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
   * Resolves collection posterSrc and backgroundSrc.
   * The poster could be a collage of the covers of the items in the collection.
   */
  static async resolveCollectionImages(
    collection: CollectionModel,
    libraryId: string,
    libraryType: LibraryType,
  ): Promise<{
    poster: string | null;
    background: string | null;
  }> {
    const collectionImages = await LibraryManager.getCollectionImages(collection, libraryType);

    if (collectionImages.images.length === 0)
      return {
        poster: collectionImages.poster,
        background: collectionImages.background,
      };

    // Generate collage
    const ratio = libraryType === LibraryTypes.MUSIC ? 'square' : 'poster';
    const collageBuffer = await imageProcessingService.generateCollage(
      collectionImages.images,
      ratio,
      libraryType,
    );

    // Save collage image
    const outputDir = fileSystemService.getExternalPath(
      fileSystemService.join('resources', 'img', 'collages', collection.id),
    );
    fileSystemService.createFolder(outputDir);
    const fileName = `collage-${collection.id}-${libraryId}.jpg`;
    const filePath = fileSystemService.join(outputDir, fileName);
    fileSystemService.writeImage(filePath, collageBuffer);

    const collectionPoster = fileSystemService.join('img', 'collages', collection.id, fileName);

    collection.posterSrc = collectionImages.poster || collection.posterSrc;
    collection.backgroundSrc = collectionImages.background || collection.backgroundSrc;

    await collection.save();

    return {
      poster: collectionPoster,
      background: collectionImages.background,
    };
  }

  /**
   * Starts a background scan of a library's files.
   */
  public static async startLibraryScan(libraryId: string) {
    const library = await LibraryManager.getLibraryById(libraryId); // reuses own method
    await clearLibrary(libraryId);
    // This is a fire-and-forget operation, so no await is needed here.
    useCases.scanLibrary().execute(library, false);
    return `Scan initiated for library: ${library.name}`;
  }
}
