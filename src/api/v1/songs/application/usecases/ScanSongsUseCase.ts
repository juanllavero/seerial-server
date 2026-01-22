import { Library } from "@/api/v1/libraries/domain/Library";
import { FileSystemServicePort } from "@/api/v1/shared/application/ports/FileSystemServicePort";
import {
  notificationService,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import logger from "@/utils/logger";
import { getFileName } from "@/utils/utils";

export class ScanSongsUseCase {
  constructor(private readonly fileSystemService: FileSystemServicePort) {}

  async execute(library: Library, root: string): Promise<void> {
    logger.info(
      {
        libraryId: library.id,
        rootFolder: root,
      },
      "Starting songs scan execution"
    );

    if (!(await this.fileSystemService.isFolder(root))) {
      logger.error(
        {
          libraryId: library.id,
          rootFolder: root,
        },
        "Root folder is not a valid folder, cannot proceed with songs scan"
      );
      return;
    }

    logger.info(
      {
        libraryId: library.id,
        rootFolder: root,
      },
      "Root folder validated, proceeding with collection setup"
    );

    // Add collection or retrieve existing one
    const collectionTitle = getFileName(root);
    logger.debug(
      {
        libraryId: library.id,
        collectionTitle,
      },
      "Creating or retrieving music collection"
    );

    const collection = await useCases.addCollection().execute({
      title: collectionTitle,
    });

    if (!collection) {
      logger.error(
        {
          libraryId: library.id,
          collectionTitle,
        },
        "Failed to create or retrieve collection for songs"
      );
      return;
    }

    logger.info(
      {
        libraryId: library.id,
        collectionId: collection.id,
        collectionTitle: collection.title,
      },
      "Successfully created/retrieved collection for songs"
    );

    try {
      await useCases
        .addLibraryToCollection()
        .execute(library.id, collection.id);
      logger.debug(
        {
          libraryId: library.id,
          collectionId: collection.id,
        },
        "Successfully added library to collection"
      );
    } catch (error) {
      logger.error(
        {
          libraryId: library.id,
          collectionId: collection.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to add library to collection"
      );
      return;
    }

    // Get music files inside folder (4 folders of depth)
    logger.info(
      {
        libraryId: library.id,
        rootFolder: root,
        collectionId: collection.id,
      },
      "Scanning for music files in folder and subfolders"
    );

    const musicFiles = await this.fileSystemService.getValidMusicFiles(root);

    logger.info(
      {
        libraryId: library.id,
        rootFolder: root,
        musicFilesCount: musicFiles.length,
      },
      "Found music files to process"
    );

    if (musicFiles.length === 0) {
      logger.warn(
        {
          libraryId: library.id,
          rootFolder: root,
          collectionId: collection.id,
        },
        "No music files found in folder, completing scan"
      );
      notificationService.mutateLibrary(library.id);
      return;
    }

    // Cache albums to avoid heap overflow
    logger.debug(
      {
        libraryId: library.id,
        collectionId: collection.id,
      },
      "Caching existing albums to avoid heap overflow"
    );

    const allAlbums = (await useCases.getAlbums().execute(library.id)) || [];
    const albumMap = new Map(allAlbums.map((album) => [album.title, album]));

    logger.info(
      {
        libraryId: library.id,
        cachedAlbumsCount: albumMap.size,
      },
      "Successfully cached existing albums"
    );

    //Process each file
    let processedFiles = 0;
    let skippedFiles = 0;

    logger.info(
      {
        libraryId: library.id,
        musicFilesCount: musicFiles.length,
      },
      "Starting to process individual music files"
    );

    for (const file of musicFiles) {
      if (library.analyzedFiles[file]) {
        logger.debug(
          {
            libraryId: library.id,
            filePath: file,
            existingSongId: library.analyzedFiles[file],
          },
          "File already analyzed, skipping"
        );
        skippedFiles++;
        continue;
      }

      logger.info(
        {
          libraryId: library.id,
          filePath: file,
          collectionId: collection.id,
        },
        "Processing music file"
      );

      try {
        await useCases
          .processSongFile()
          .execute(root, library, file, collection, albumMap);
        processedFiles++;
        logger.debug(
          {
            libraryId: library.id,
            filePath: file,
          },
          "Successfully processed music file"
        );
      } catch (error) {
        logger.error(
          {
            libraryId: library.id,
            filePath: file,
            collectionId: collection.id,
            error: error instanceof Error ? error.message : String(error),
          },
          "Failed to process music file"
        );
      }
    }

    logger.info(
      {
        libraryId: library.id,
        totalFiles: musicFiles.length,
        processedFiles,
        skippedFiles,
      },
      "Completed processing all music files"
    );

    // Update content in clients
    notificationService.mutateLibrary(library.id);
    logger.debug(
      {
        libraryId: library.id,
      },
      "Sent library mutation notification to clients"
    );
  }
}
