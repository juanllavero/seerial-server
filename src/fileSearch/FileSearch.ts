import os from 'os';
import pLimit from 'p-limit';
import path from 'path';
import { Library } from '../data/interfaces/Media';
import { addLibrary } from '../db/post/postData';
import { Utils } from '../utils/Utils';
import { WebSocketManager } from '../WebSockets/WebSocketManager';
import { scanMovie } from './movies/searchMovies';
import { scanMusic } from './music/musicSearch';
import { scanTVShow } from './series/searchSeries';

export class FileSearch {
  static BASE_URL: string = 'https://image.tmdb.org/t/p/original';

  static library: Library | null;

  // Number of threads (1 is already being used by this app)
  static availableThreads = Math.max(os.cpus().length - 1, 1);

  public static async scanFiles(
    newLibrary: Library,
    wsManager: WebSocketManager,
    addNewLibrary: boolean
  ): Promise<Library | undefined> {
    if (!newLibrary) return undefined;

    if (addNewLibrary) {
      addLibrary(newLibrary);
      Utils.addLibrary(wsManager, newLibrary);
    }

    FileSearch.library = newLibrary;

    // Get available threads
    let availableThreads = Math.max(os.cpus().length - 2, 1);

    if (newLibrary.type === 'Music') {
      availableThreads = Math.min(availableThreads, 4);
    }
    const limit = pLimit(availableThreads);

    const tasks: Promise<void>[] = [];

    for (const rootFolder of newLibrary.folders) {
      const filesInFolder = await Utils.getFilesInFolder(rootFolder);

      for (const file of filesInFolder) {
        const filePath = path.join(file.parentPath, file.name);

        const task = limit(async () => {
          if (newLibrary.type === 'Shows') {
            await scanTVShow(filePath, wsManager);
          } else if (newLibrary.type === 'Movies') {
            await scanMovie(filePath, wsManager);
          } else {
            await scanMusic(filePath, wsManager);
          }
        });
        tasks.push(task);
      }
    }

    Promise.all(tasks);

    Utils.updateLibrary(wsManager, newLibrary);

    return newLibrary;
  }
}
