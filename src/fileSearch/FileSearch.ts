import os from "os";
import pLimit from "p-limit";
import path from "path";
import { Library as LibraryData } from "../data/interfaces/Media";
import { Library } from "../data/models/Media/Library.model";
import { getLibraryById } from "../db/get/getData";
import { addLibrary } from "../db/post/postData";
import { Utils } from "../utils/Utils";
import { WebSocketManager } from "../WebSockets/WebSocketManager";
import { scanMovie } from "./movies/searchMovies";
import { scanMusic } from "./music/musicSearch";
import { scanTVShow } from "./series/searchSeries";

export class FileSearch {
  static BASE_URL: string = "https://image.tmdb.org/t/p/original";

  // Number of threads (1 is already being used by this app)
  static availableThreads = Math.max(os.cpus().length - 1, 1);

  public static async scanFiles(
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
    let availableThreads = Math.max(os.cpus().length - 2, 1);

    if (library.type === "Music") {
      availableThreads = Math.min(availableThreads, 4);
    }
    const limit = pLimit(availableThreads);

    const tasks: Promise<void>[] = [];

    for (const rootFolder of library.folders) {
      const filesInFolder = await Utils.getFilesInFolder(rootFolder);

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

    Promise.all(tasks);

    // Save data in DB
    //library.save();
    //Utils.updateLibrary(wsManager, newLibrary);

    return library;
  }
}
