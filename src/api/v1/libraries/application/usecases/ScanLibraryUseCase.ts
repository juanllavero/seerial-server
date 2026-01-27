import { FileSystemServicePort } from "@/api/v1/shared/application/ports/FileSystemServicePort";
import {
  notificationService,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import logger from "@/utils/logger";
import os from "os";
import pLimit from "p-limit";
import path from "path";
import { Library } from "../../domain/Library";
import { LibrariesRepositoryPort } from "../ports/LibrariesRepositoryPort";

export class ScanLibraryUseCase {
  constructor(
    private readonly filesManager: FileSystemServicePort,
    private readonly librariesRepo: LibrariesRepositoryPort
  ) {}

  async execute(newLibrary: Library, addNewLibrary: boolean) {
    logger.info(
      {
        addNewLibrary,
        libraryName: newLibrary?.name,
        libraryType: newLibrary?.type,
      },
      "Starting library scan execution"
    );

    if (!newLibrary) {
      logger.error("No library provided for scan");
      return undefined;
    }

    const library = addNewLibrary
      ? await this.librariesRepo.create(newLibrary)
      : await this.librariesRepo.getById(newLibrary.id ?? "");

    if (!library) {
      logger.error(
        {
          addNewLibrary,
          libraryId: newLibrary.id,
        },
        "Failed to create or retrieve library"
      );
      return undefined;
    }

    logger.info(
      {
        libraryId: library.id,
        libraryType: library.type,
        folderCount: library.folders.length,
      },
      "Library successfully created or retrieved"
    );

    // Get available threads
    let availableThreads = Math.max(os.cpus().length / 2, 1);

    if (library.type === "Music") {
      availableThreads = Math.min(availableThreads, 2);
    }
    const limit = pLimit(availableThreads);

    logger.info(
      {
        libraryId: library.id,
        availableThreads,
        cpuCount: os.cpus().length,
        libraryType: library.type,
      },
      "Calculated available threads for scanning"
    );

    const tasks: Promise<void>[] = [];

    for (const rootFolder of library.folders) {
      logger.info(
        {
          libraryId: library.id,
          rootFolder,
        },
        "Starting to scan folder"
      );

      const filesInFolder = await this.filesManager.getFilesInFolder(
        rootFolder
      );

      logger.info(
        {
          libraryId: library.id,
          rootFolder,
          fileCount: filesInFolder.length,
        },
        "Retrieved files from folder"
      );

      for (const file of filesInFolder) {
        const filePath = path.join(file.parentPath, file.name);

        const task = limit(async () => {
          logger.info(
            {
              libraryId: library.id,
              filePath,
              libraryType: library.type,
            },
            "Processing file for metadata extraction"
          );

          try {
            if (library.type === "Shows") {
              await useCases.scanSeries().execute(library, filePath);
            } else if (library.type === "Movies") {
              await useCases.scanMovie().execute(library, filePath);
            } else {
              await useCases.scanSongs().execute(library, filePath);
            }

            logger.info(
              {
                libraryId: library.id,
                filePath,
                libraryType: library.type,
              },
              "Successfully processed file"
            );
          } catch (error) {
            logger.error(
              {
                libraryId: library.id,
                filePath,
                libraryType: library.type,
                error: error instanceof Error ? error.message : String(error),
              },
              "Failed to process file"
            );
          }
        });
        tasks.push(task);
      }
    }

    // Send message to clients
    const message = {
      header: "SCAN_STARTED",
      body: library.id,
    };
    notificationService.broadcast(JSON.stringify(message));

    Promise.all(tasks).then(() => {
      const message = {
        header: "SCAN_COMPLETE",
        body: {
          libraryId: library.id,
        },
      };
      notificationService.broadcast(JSON.stringify(message));

      logger.info(
        {
          libraryId: library.id,
          messageType: "SCAN_COMPLETE",
        },
        "Scan completed successfully, sent notification to clients"
      );
    });

    // Update content in clients
    notificationService.mutateLibrary(library.id);

    // Update Library
    this.librariesRepo.update(library.id, library);

    return library;
  }
}
