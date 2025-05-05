import { existsSync } from 'fs-extra';
import * as path from 'path';
import { parse } from 'path';
import { Library } from '../data/models/Media/Library.model';
import { DataManager } from '../db/DataManager';
import { deleteEpisode, deleteSeason } from '../db/delete/deleteData';
import {
  getEpisodeByPath,
  getSeasonById,
  getSeriesById,
} from '../db/get/getData';
import { Utils } from '../utils/Utils';
import { WebSocketManager } from '../WebSockets/WebSocketManager';

/**
 * Delete removed files from library
 * @param libraryId Library ID
 * @param wsManager Websocket manager to send updates to client
 * @returns
 */
export async function clearLibrary(
  libraryId: string,
  wsManager: WebSocketManager
) {
  const library = DataManager.libraries.find(
    (library: Library) => library.id === libraryId
  );

  if (
    !library ||
    library.analyzedFiles.size === 0 ||
    !library.folders ||
    library.folders.length === 0
  )
    return;

  // Map to associate each file with its closest root folder
  const fileToRootFolder = new Map<string, string>();

  // Group files by their root folder
  for (const filePath of library.analyzedFiles.keys()) {
    const matchingRootFolder = library.folders
      .filter((folder: string) => filePath.startsWith(folder))
      .sort((a: string, b: string) => b.length - a.length)[0]; // Sort by length in descending order to get the most specific one

    if (matchingRootFolder) {
      fileToRootFolder.set(filePath, matchingRootFolder);
    } else {
      // If there is no matching root folder, use the file's root
      const { root } = parse(filePath);
      fileToRootFolder.set(filePath, root);
    }
  }

  // Check each root folder and its associated files
  const checkedRoots = new Set<string>(); // To avoid checking the same root multiple times

  for (const [filePath, rootFolder] of fileToRootFolder) {
    const resolvedRoot = path.resolve(rootFolder);

    if (!checkedRoots.has(resolvedRoot)) {
      if (!existsSync(resolvedRoot)) {
        console.log(
          `Root folder ${resolvedRoot} is not connected. Its files will be skipped.`
        );
        checkedRoots.add(resolvedRoot);
        continue;
      }
      checkedRoots.add(resolvedRoot);
    }

    // If the root is connected, check the file
    const fileExists = existsSync(filePath);

    if (!fileExists) {
      const episode = await getEpisodeByPath(filePath);

      if (episode) {
        const season = await getSeasonById(episode.seasonId);

        if (!season) continue;

        const series = await getSeriesById(season.seriesId);

        if (!series) continue;

        await deleteEpisode(episode.id);

        if (season.episodes.length === 0) {
          await deleteSeason(season.id);

          // Update library in client
          Utils.deleteSeason(wsManager, library.id, series.id, season.id);
        }

        if (series.seasons.length === 0) {
          await DataManager.deleteShow(library.id, series.id);

          // Update library in client
          Utils.deleteSeries(wsManager, library.id, series.id);
        }
      }
    }
  }

  // Update library in client
  Utils.updateLibrary(wsManager, library);
}
