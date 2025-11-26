import { FileSystemServicePort } from "@/api/v0/shared/application/ports/FileSystemServicePort";
import {
  notificationService,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import os from "os";
import pLimit from "p-limit";
import path from "path";
import { Library } from "../../domain/Library";
import { LibrariesRepositoryPort } from "../ports/LibrariesRepositoryPort";

export class ScanLibraryUseCase {
  private static readonly scanTVShow = useCases.scanSeries();
  private static readonly scanMovie = useCases.scanMovie();
  private static readonly scanMusic = useCases.scanSongs();

  constructor(
    private readonly filesManager: FileSystemServicePort,
    private readonly librariesRepo: LibrariesRepositoryPort
  ) {}

  async execute(newLibrary: Library, addNewLibrary: boolean) {
    if (!newLibrary) return undefined;

    const library = addNewLibrary
      ? await this.librariesRepo.create(newLibrary)
      : await this.librariesRepo.getById(newLibrary.id ?? "");

    if (!library) return undefined;

    // Get available threads
    let availableThreads = Math.max(os.cpus().length / 2, 1);

    if (library.type === "Music") {
      availableThreads = Math.min(availableThreads, 2);
    }
    const limit = pLimit(availableThreads);

    const tasks: Promise<void>[] = [];

    for (const rootFolder of library.folders) {
      const filesInFolder = await this.filesManager.getFilesInFolder(
        rootFolder
      );

      for (const file of filesInFolder) {
        const filePath = path.join(file.parentPath, file.name);

        const task = limit(async () => {
          if (library.type === "Shows") {
            await ScanLibraryUseCase.scanTVShow.execute(library, filePath);
          } else if (library.type === "Movies") {
            await ScanLibraryUseCase.scanMovie.execute(library, filePath);
          } else {
            await ScanLibraryUseCase.scanMusic.execute(library, filePath);
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
    });

    // Update content in clients
    notificationService.mutateLibrary(library.id);

    // Update Library
    this.librariesRepo.update(library.id, library);

    return library;
  }
}
