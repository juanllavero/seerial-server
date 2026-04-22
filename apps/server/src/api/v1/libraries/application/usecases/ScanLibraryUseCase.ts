import os from 'node:os';
import path from 'node:path';
import { realpath } from 'node:fs/promises';
import pLimit from 'p-limit';
import type { FileSystemServicePort } from '@/api/v1/shared/application/ports/FileSystemServicePort';
import {
  notificationService,
  useCases,
} from '@/api/v1/shared/infrastructure/adapters/di/container';
import logger from '@/utils/logger';
import type { Library } from '../../domain/Library';
import type { LibrariesRepositoryPort } from '../ports/LibrariesRepositoryPort';

export class ScanLibraryUseCase {
  constructor(
    private readonly filesManager: FileSystemServicePort,
    private readonly librariesRepo: LibrariesRepositoryPort,
  ) { }

  async execute(newLibrary: Library, addNewLibrary: boolean) {
    logger.info(
      {
        addNewLibrary,
        libraryName: newLibrary?.name,
        libraryType: newLibrary?.type,
      },
      'Starting library scan execution',
    );

    if (!newLibrary) {
      logger.error('No library provided for scan');
      return undefined;
    }

    const library = addNewLibrary
      ? await this.librariesRepo.create(newLibrary)
      : await this.librariesRepo.getById(newLibrary.id ?? '');

    if (!library) {
      logger.error(
        {
          addNewLibrary,
          libraryId: newLibrary.id,
        },
        'Failed to create or retrieve library',
      );
      return undefined;
    }

    // Send SCAN_STARTED immediately
    const message = {
      header: 'SCAN_STARTED',
      body: library.id,
    };
    notificationService.broadcast(JSON.stringify(message));
    notificationService.mutateLibrary(library.id);

    // Fire and forget - processing continues in background
    this.executeScan(library, addNewLibrary).catch((error) => {
      logger.error({ libraryId: library.id, error }, 'Scan execution failed');
    });

    return library;
  }

  private async executeScan(library: Library, addNewLibrary: boolean): Promise<void> {
    let availableThreads = Math.max(os.cpus().length / 2, 1);

    if (library.type === 'Music') {
      availableThreads = Math.min(availableThreads, 2);
    }
    const limit = pLimit(availableThreads);

    const foldersToScan = await this.resolveAccessibleFolders(library, addNewLibrary);

    const tasks: Promise<void>[] = [];

    for (const rootFolder of foldersToScan) {
      logger.info(
        {
          libraryId: library.id,
          rootFolder,
        },
        'Starting to scan folder',
      );

      const filesInFolder = await this.filesManager.getFilesInFolder(rootFolder);

      for (const file of filesInFolder) {
        const filePath = path.join(file.parentPath, file.name);

        const task = limit(async () => {
          try {
            if (library.type === 'Shows') {
              await useCases.scanSeries().execute(library, filePath);
            } else if (library.type === 'Movies') {
              await useCases.scanMovie().execute(library, filePath);
            } else {
              await useCases.scanMusic().execute(library, filePath);
            }
          } catch (error) {
            logger.error(
              {
                libraryId: library.id,
                filePath,
                libraryType: library.type,
                error: error instanceof Error ? error.message : String(error),
              },
              'Failed to process file',
            );
          }
        });
        tasks.push(task);
      }
    }

    // Wait for all tasks to complete
    await Promise.all(tasks);

    // Update Library
    await this.librariesRepo.update(library.id, library);

    // Update content in clients
    notificationService.mutateLibrary(library.id);

    // Send SCAN_COMPLETE after everything finishes
    const message = {
      header: 'SCAN_COMPLETE',
      body: {
        libraryId: library.id,
      },
    };
    notificationService.broadcast(JSON.stringify(message));

    logger.info(
      {
        libraryId: library.id,
        messageType: 'SCAN_COMPLETE',
      },
      'Scan completed successfully, sent notification to clients',
    );
  }

  private async resolveAccessibleFolders(
    library: Library,
    addNewLibrary: boolean,
  ): Promise<string[]> {
    const accessibleFolders: string[] = [];

    for (const rootFolder of library.folders) {
      const isAccessible = await this.filesManager.isFolder(rootFolder);
      if (!isAccessible) {
        logger.warn(
          { libraryId: library.id, rootFolder },
          'Root folder not accessible (drive may be disconnected), skipping',
        );
        continue;
      }
      accessibleFolders.push(rootFolder);
    }

    if (!addNewLibrary && accessibleFolders.length > 0) {
      await this.cleanupMissingContent(library, accessibleFolders);
    }

    return accessibleFolders;
  }

  private async cleanupMissingContent(
    library: Library,
    accessibleRoots: string[],
  ): Promise<void> {
    logger.info(
      { libraryId: library.id, accessibleRoots },
      'Starting cleanup scan for missing content',
    );

    if (library.type !== 'Music') {
      await this.cleanupMissingFolders(library, accessibleRoots);
    }

    const updatedLibrary = await this.librariesRepo.getById(library.id);
    const currentAnalyzedFiles = updatedLibrary?.analyzedFiles ?? library.analyzedFiles;
    await this.cleanupMissingFiles(library.id, library.type, currentAnalyzedFiles, accessibleRoots);

    if (library.type === 'Music') {
      await this.cleanupEmptyAlbums(library.id, accessibleRoots);
      await this.cleanupEmptyCollections(library.id);
    }

    logger.info({ libraryId: library.id }, 'Cleanup scan for missing content completed');
  }

  private async cleanupMissingFolders(
    library: Library,
    accessibleRoots: string[],
  ): Promise<void> {
    for (const [folderPath, contentId] of Object.entries(library.analyzedFolders)) {
      if (!accessibleRoots.some((root) => folderPath.startsWith(root))) continue;

      const missing = await this.isFolderMissing(folderPath);
      if (missing) {
        logger.info(
          { folderPath, contentId, libraryType: library.type },
          'Analyzed folder no longer exists or was renamed, removing content from DB',
        );
        await this.deleteFolderContent(library.type, library.id, folderPath, contentId);
      }
    }
  }

  /**
   * Returns true if the folder is gone or was case-renamed.
   * On case-insensitive systems (Windows NTFS), a folder renamed from "DIO" to "Dio"
   * still resolves via isFolder, so we compare against the real on-disk path.
   */
  private async isFolderMissing(folderPath: string): Promise<boolean> {
    const exists = await this.filesManager.isFolder(folderPath);
    if (!exists) return true;

    try {
      const real = await realpath(folderPath);
      const norm = (p: string) => p.replace(/[/\\]/g, '/');
      return norm(real) !== norm(folderPath);
    } catch {
      return true;
    }
  }

  /**
   * Returns true if the file is gone or its parent path was case-renamed.
   */
  private async isFileMissing(filePath: string): Promise<boolean> {
    const exists = await this.filesManager.isFile(filePath);
    if (!exists) return true;

    try {
      const real = await realpath(filePath);
      const norm = (p: string) => p.replace(/[/\\]/g, '/');
      return norm(real) !== norm(filePath);
    } catch {
      return true;
    }
  }

  private async deleteFolderContent(
    libraryType: Library['type'],
    libraryId: string,
    folderPath: string,
    contentId: string,
  ): Promise<void> {
    try {
      if (libraryType === 'Shows') {
        await useCases.deleteSeries().execute(contentId);
      } else {
        await useCases.deleteMovie().execute(contentId);
      }
    } catch (error) {
      logger.error(
        {
          folderPath,
          contentId,
          err: error instanceof Error ? error.message : String(error),
        },
        'Failed to delete content for missing folder',
      );
    }
    try {
      await this.librariesRepo.removeAnalyzedFolder(libraryId, folderPath);
    } catch (error) {
      logger.error(
        { folderPath, err: error instanceof Error ? error.message : String(error) },
        'Failed to remove analyzed folder entry',
      );
    }
  }

  private async cleanupMissingFiles(
    libraryId: string,
    libraryType: Library['type'],
    analyzedFiles: Record<string, string>,
    accessibleRoots: string[],
  ): Promise<void> {
    for (const [filePath, contentId] of Object.entries(analyzedFiles)) {
      if (!accessibleRoots.some((root) => filePath.startsWith(root))) continue;

      const missing = await this.isFileMissing(filePath);
      if (missing) {
        logger.info(
          { filePath, contentId, libraryType },
          'Analyzed file no longer exists or was renamed, removing content from DB',
        );
        await this.deleteFileContent(libraryId, libraryType, filePath, contentId);
      }
    }
  }

  private async deleteFileContent(
    libraryId: string,
    libraryType: Library['type'],
    filePath: string,
    contentId: string,
  ): Promise<void> {
    try {
      if (libraryType === 'Shows') {
        await useCases.deleteEpisode().execute(contentId);
      } else if (libraryType === 'Movies') {
        await useCases.deleteVideo().execute(contentId);
      } else {
        await useCases.deleteSong().execute(contentId);
      }
    } catch (error) {
      logger.error(
        {
          filePath,
          contentId,
          err: error instanceof Error ? error.message : String(error),
        },
        'Failed to delete content for missing file',
      );
    }
    try {
      await this.librariesRepo.removeAnalyzedFile(libraryId, filePath);
    } catch (error) {
      logger.error({ filePath, error }, 'Failed to remove analyzed file entry');
    }
  }

  private async cleanupEmptyAlbums(libraryId: string, accessibleRoots: string[]): Promise<void> {
    const albums = await useCases.getAlbums().execute(libraryId);
    for (const album of albums) {
      if (!album.id) continue;
      const songs = await useCases.getSongsByAlbum().execute(album.id);

      const hasNoLiveSongs = await this.albumHasNoLiveSongs(songs, accessibleRoots);
      if (!hasNoLiveSongs) continue;

      logger.info({ albumId: album.id, title: album.title }, 'Album has no live songs on disk, removing from DB');

      // Clean up analyzedFiles entries for this album's songs
      for (const song of songs) {
        try {
          await this.librariesRepo.removeAnalyzedFile(libraryId, song.fileSrc);
        } catch (_) {
          // Entry may have already been removed by cleanupMissingFiles
        }
      }

      try {
        await useCases.deleteAlbum().execute(album.id);
      } catch (error) {
        logger.error(
          { albumId: album.id, err: error instanceof Error ? error.message : String(error) },
          'Failed to delete album without live songs',
        );
      }
    }
  }

  private async albumHasNoLiveSongs(
    songs: Array<{ fileSrc: string }>,
    accessibleRoots: string[],
  ): Promise<boolean> {
    if (songs.length === 0) return true;

    const accessibleSongs = songs.filter((song) =>
      accessibleRoots.some((root) => song.fileSrc.startsWith(root)),
    );

    // If none of the songs fall under accessible roots, skip deletion (drive may be disconnected)
    if (accessibleSongs.length === 0) return false;

    for (const song of accessibleSongs) {
      if (!(await this.isFileMissing(song.fileSrc))) return false;
    }
    return true;
  }

  private async cleanupEmptyCollections(libraryId: string): Promise<void> {
    const collections = await useCases.getAllCollectionsInLibrary().execute(libraryId);
    for (const collection of collections) {
      const full = await useCases.getCollectionById().execute(collection.id);
      if (!full || full.albums.length > 0) continue;
      logger.info({ collectionId: collection.id }, 'Collection has no albums, removing from DB');
      try {
        await useCases.deleteCollection().execute(collection.id);
      } catch (error) {
        logger.error({ collectionId: collection.id, error }, 'Failed to delete empty collection');
      }
    }
  }
}
