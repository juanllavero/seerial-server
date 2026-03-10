import os from 'os';
import pLimit from 'p-limit';
import path from 'path';
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
  ) {}

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
    this.executeScan(library).catch((error) => {
      logger.error({ libraryId: library.id, error }, 'Scan execution failed');
    });

    return library;
  }

  private async executeScan(library: Library): Promise<void> {
    let availableThreads = Math.max(os.cpus().length / 2, 1);

    if (library.type === 'Music') {
      availableThreads = Math.min(availableThreads, 2);
    }
    const limit = pLimit(availableThreads);

    const tasks: Promise<void>[] = [];

    for (const rootFolder of library.folders) {
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
}
