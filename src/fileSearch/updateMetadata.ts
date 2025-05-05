import { Library } from '../data/models/Media/Library.model';
import { DataManager } from '../db/DataManager';
import { Utils } from '../utils/Utils';
import { WebSocketManager } from '../WebSockets/WebSocketManager';
import { FileSearch } from './FileSearch';
import { scanMovie } from './movies/searchMovies';

import { scanTVShow } from './series/searchSeries';
export async function updateShowMetadata(
  libraryId: string,
  showId: string,
  newTheMovieDBID: number,
  wsManager: WebSocketManager,
  newepisodeGroupId?: string
) {
  const library = DataManager.libraries.find(
    (library: Library) => library.id === libraryId
  );

  if (!library) return;

  FileSearch.library = library;

  const show = library.getSeriesById(showId);

  if (!show) return;

  // Delete previous data
  await DataManager.deleteSeriesData(library, show);

  // Restore folder stored in library
  library.analyzedFolders.set(show.folder, show.id);

  // Clear season list
  show.seasons = [];

  // Update TheMovieDB ID
  show.setthemdbId(newTheMovieDBID);

  // Update EpisodeGroup ID if param is passed
  if (newepisodeGroupId) {
    show.setepisodeGroupId(newepisodeGroupId);
  }

  // Set element loading to show in client
  show.analyzingFiles = true;

  Utils.updateSeries(wsManager, library.id, show);

  // Get new data
  await scanTVShow(show.folder, wsManager);
}

export async function updateMovieMetadata(
  libraryId: string,
  seriesId: string,
  seasonId: string,
  newTheMovieDBID: number,
  wsManager: WebSocketManager
) {
  const library = DataManager.libraries.find(
    (library: Library) => library.id === libraryId
  );

  if (!library) return;

  FileSearch.library = library;

  const collection = library.getSeriesById(seriesId);

  if (!collection) return;

  const movie = collection.getSeasonById(seasonId);

  if (!movie) return;

  // Delete previous data
  await DataManager.deleteSeasonData(library, movie);

  // Restore folder in library
  library.getSeasonFolders().set(movie.folder, movie.id);

  // Clear episode list
  movie.episodes = [];

  // Update TheMovieDB ID
  movie.setthemdbId(newTheMovieDBID);

  // Set element loading to show in client
  collection.analyzingFiles = true;

  Utils.updateSeries(wsManager, library.id, collection);

  // Get new data
  await scanMovie(movie.folder, wsManager);
}
