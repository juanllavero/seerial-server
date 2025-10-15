import { Library } from "@/api/v0/index.models";
import {
  addLibrary,
  getLibraryById,
} from "@/api/v0/libraries/libraries.service";
import { LibraryData } from "@/api/v0/libraries/libraries.types";
import { FilesManager } from "@/managers/FilesManager";
import { WebSocketManager } from "@/managers/WebSocketManager";
import os from "os";
import pLimit from "p-limit";
import path from "path";
import { scanMovie } from "./movies/searchMovies";
import { scanMusic } from "./music/musicSearch";
import { scanTVShow } from "./series/searchSeries";

export async function scanFiles(
  newLibrary: Partial<LibraryData>,
  wsManager: WebSocketManager,
  addNewLibrary: boolean
): Promise<Library | undefined> {
  if (!newLibrary) return undefined;

  const library = addNewLibrary
    ? await addLibrary(newLibrary)
    : await getLibraryById(newLibrary.id ?? "");

  if (!library) return undefined;

  // Get available threads
  let availableThreads = Math.max(os.cpus().length / 2, 1);

  if (library.type === "Music") {
    availableThreads = Math.min(availableThreads, 2);
  }
  const limit = pLimit(availableThreads);

  const tasks: Promise<void>[] = [];

  for (const rootFolder of library.folders) {
    const filesInFolder = await FilesManager.getFilesInFolder(rootFolder);

    for (const file of filesInFolder) {
      const filePath = path.join(file.parentPath, file.name);

      const task = limit(async () => {
        if (library.type === "Shows") {
          await scanTVShow(library, filePath, wsManager);
        } else if (library.type === "Movies") {
          await scanMovie(library, filePath, wsManager);
        } else {
          await scanMusic(library, filePath, wsManager);
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
  wsManager.broadcast(JSON.stringify(message));

  Promise.all(tasks).then(() => {
    const message = {
      header: "SCAN_COMPLETE",
      body: {
        libraryId: library.id,
      },
    };
    wsManager.broadcast(JSON.stringify(message));
  });

  // Update content in clients
  WebSocketManager.mutateLibrary(wsManager, library.id);

  return library;
}
