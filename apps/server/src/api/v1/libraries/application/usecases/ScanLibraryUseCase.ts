import { realpath } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
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

    if (library.type === 'Shows') {
      await this.cleanupNamelessSeries(library.id);
    }

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
    await this.cleanupMissingFiles(library, currentAnalyzedFiles, accessibleRoots);

    // Cleanup empty collections/albums/series after removing missing content, to avoid leaving orphaned entries in the DB
    await this.cleanupEmptyCollections(library.id);
    if (library.type === 'Music') {
      await this.cleanupEmptyAlbums(library, accessibleRoots);
    } else if (library.type === 'Shows') {
      await this.cleanupEmptySeries(library, accessibleRoots);
    } else if (library.type === 'Movies') {
      await this.cleanupEmptyMovies(library, accessibleRoots);
    }

    logger.info({ libraryId: library.id }, 'Cleanup scan for missing content completed');
  }

  private async cleanupMissingFolders(
    library: Library,
    accessibleRoots: string[],
  ): Promise<void> {
    for (const [folderPath, contentId] of Object.entries(library.analyzedFolders)) {
      if (!this.isAccessibleRoot(folderPath, accessibleRoots)) continue;

      const missing = await this.isFolderMissing(folderPath);
      if (missing) {
        logger.info(
          { folderPath, contentId, libraryType: library.type },
          'Analyzed folder no longer exists or was renamed, removing content from DB',
        );
        await this.deleteFolderContent(library, folderPath, contentId);
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
    library: Library,
    folderPath: string,
    contentId: string,
  ): Promise<void> {
    try {
      if (library.type === 'Shows') {
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
      await this.librariesRepo.removeAnalyzedFolder(library.id, folderPath);
      delete library.analyzedFolders[folderPath];
    } catch (error) {
      logger.error(
        { folderPath, err: error instanceof Error ? error.message : String(error) },
        'Failed to remove analyzed folder entry',
      );
    }
  }

  private async cleanupMissingFiles(
    library: Library,
    analyzedFiles: Record<string, string>,
    accessibleRoots: string[],
  ): Promise<void> {
    for (const [filePath, contentId] of Object.entries(analyzedFiles)) {
      if (!this.isAccessibleRoot(filePath, accessibleRoots)) continue;

      const missing = await this.isFileMissing(filePath);
      if (missing) {
        logger.info(
          { filePath, contentId, libraryType: library.type },
          'Analyzed file no longer exists or was renamed, removing content from DB',
        );
        await this.deleteFileContent(library, filePath, contentId);
      }
    }
  }

  private async deleteFileContent(
    library: Library,
    filePath: string,
    contentId: string,
  ): Promise<void> {
    try {
      if (library.type === 'Shows') {
        await useCases.deleteEpisode().execute(contentId);
      } else if (library.type === 'Movies') {
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
      await this.librariesRepo.removeAnalyzedFile(library.id, filePath);
      delete library.analyzedFiles[filePath];
    } catch (error) {
      logger.error({ filePath, error }, 'Failed to remove analyzed file entry');
    }
  }

  private async cleanupEmptySeries(library: Library, accessibleRoots: string[]): Promise<void> {
    const seriesList = await useCases.getSeries().execute(library.id, 'all');

    for (const series of seriesList) {
      if (!series.id) continue;

      const episodes = series.seasons.flatMap(season => season.episodes);

      const hasNoLiveEpisodes = await this.hasNoLiveFiles(episodes.map(e => ({
        fileSrc: e.video.fileSrc,
      })), accessibleRoots);
      if (!hasNoLiveEpisodes) continue;

      logger.info({ seriesId: series.id, name: series.name }, 'Series has no live episodes on disk, removing from DB');

      // Clean up analyzedFiles entries for this series' episodes
      for (const episode of episodes) {
        try {
          await this.librariesRepo.removeAnalyzedFile(library.id, episode.video.fileSrc);
          delete library.analyzedFiles[episode.video.fileSrc];
        } catch (_) { }
      }

      // Delete the Series
      try {
        await useCases.deleteSeries().execute(series.id);

        // 3. Clean up analyzedFolders entries for this series
        for (const [folderPath, contentId] of Object.entries(library.analyzedFolders)) {
          if (contentId === series.id) {
            await this.librariesRepo.removeAnalyzedFolder(library.id, folderPath);
            delete library.analyzedFolders[folderPath];
          }
        }
      } catch (error) {
        logger.error(
          { seriesId: series.id, err: error instanceof Error ? error.message : String(error) },
          'Failed to delete empty series'
        );
      }
    }
  }

  private async cleanupEmptyMovies(library: Library, accessibleRoots: string[]): Promise<void> {
    const movies = await useCases.getMovies().execute(library.id);

    for (const movie of movies) {
      if (!movie.id) continue;

      const videos = await useCases.getVideoByMovieId().execute(movie.id);

      // If the movie has no videos, it means it was scanned but all its files are missing. We can safely delete it without checking analyzedFiles, to avoid leaving orphaned entries in the DB.
      const hasNoLiveVideos = await this.hasNoLiveFiles(videos, accessibleRoots);
      if (!hasNoLiveVideos) continue;


      // Clean up analyzedFiles entries for this movie's videos
      for (const video of videos) {
        try {
          await this.librariesRepo.removeAnalyzedFile(library.id, video.fileSrc);
          delete library.analyzedFiles[video.fileSrc];
        } catch (_) { }
      }

      // Delete the Movie
      try {
        await useCases.deleteMovie().execute(movie.id);

        // Clean up analyzedFolders entries for this movie
        for (const [folderPath, contentId] of Object.entries(library.analyzedFolders)) {
          if (contentId === movie.id) {
            await this.librariesRepo.removeAnalyzedFolder(library.id, folderPath);
            delete library.analyzedFolders[folderPath];
          }
        }
      } catch (error) {
        logger.error(
          { movieId: movie.id, err: error instanceof Error ? error.message : String(error) },
          'Failed to delete empty movie'
        );
      }
    }
  }

  private async cleanupEmptyAlbums(library: Library, accessibleRoots: string[]): Promise<void> {
    const albums = await useCases.getAlbums().execute(library.id);
    for (const album of albums) {
      if (!album.id) continue;
      const songs = await useCases.getSongsByAlbum().execute(album.id);

      const hasNoLiveSongs = await this.hasNoLiveFiles(songs, accessibleRoots);
      if (!hasNoLiveSongs) continue;

      logger.info({ albumId: album.id, title: album.title }, 'Album has no live songs on disk, removing from DB');

      // Clean up analyzedFiles entries for this album's songs
      for (const song of songs) {
        try {
          await this.librariesRepo.removeAnalyzedFile(library.id, song.fileSrc);
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

  private async hasNoLiveFiles(
    files: Array<{ fileSrc: string }>,
    accessibleRoots: string[],
  ): Promise<boolean> {
    if (files.length === 0) return true;

    const accessibleFiles = files.filter((file) =>
      accessibleRoots.some((root) => {
        const normRoot = root.replace(/[/\\]/g, '/').toLowerCase();
        const normPath = file.fileSrc.replace(/[/\\]/g, '/').toLowerCase();
        return normPath.startsWith(normRoot);
      }),
    );

    // If none of the files are in the accessible roots, the disk might be disconnected.
    // Return false to avoid accidental deletion.
    if (!this.isAccessibleRoot(files[0].fileSrc, accessibleRoots)) return false;

    for (const file of accessibleFiles) {
      // If at least one file exists, the content (Movie/Series) is still alive
      if (!(await this.isFileMissing(file.fileSrc))) return false;
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

  private async cleanupNamelessSeries(libraryId: string): Promise<void> {
    const latestLibrary = await this.librariesRepo.getById(libraryId);
    if (!latestLibrary) return;

    for (const [folderPath, seriesId] of Object.entries(latestLibrary.analyzedFolders)) {
      const series = await useCases.getSeriesById().execute(seriesId);

      if (!series) {
        logger.warn(
          { libraryId, folderPath, seriesId },
          'Series referenced in analyzedFolders does not exist, cleaning stale entry',
        );
        await this.safeRemoveAnalyzedFolder(libraryId, folderPath);
        continue;
      }

      if (series.name.trim().length > 0) continue;

      logger.warn(
        { libraryId, folderPath, seriesId },
        'Series has empty name after scan, removing invalid series',
      );

      try {
        await useCases.deleteSeries().execute(seriesId);
      } catch (error) {
        logger.error(
          {
            libraryId,
            folderPath,
            seriesId,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to delete nameless series, cleaning analyzed folder as fallback',
        );
        await this.safeRemoveAnalyzedFolder(libraryId, folderPath);
      }
    }
  }

  private async safeRemoveAnalyzedFolder(libraryId: string, folderPath: string): Promise<void> {
    try {
      await this.librariesRepo.removeAnalyzedFolder(libraryId, folderPath);
    } catch (error) {
      logger.error(
        {
          libraryId,
          folderPath,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to remove analyzed folder entry during cleanup',
      );
    }
  }

  private isAccessibleRoot(folderPath: string, accessibleRoots: string[]): boolean {
    return accessibleRoots.some((root) => {
      // Normalize paths to compare in a case-insensitive way and handle different separators
      const normRoot = root.replace(/[/\\]/g, '/').toLowerCase();
      const normPath = folderPath.replace(/[/\\]/g, '/').toLowerCase();
      return normPath.startsWith(normRoot);
    });
  }
}
