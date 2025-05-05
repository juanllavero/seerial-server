import {
  Collection as CollectionData,
  Episode as EpisodeData,
  Library as LibraryData,
  Movie as MovieData,
  Season as SeasonData,
  Series as SeriesData,
  Video as VideoData,
} from '../../data/interfaces/Media';
import { Collection } from '../../data/models/Collections/Collection.model';
import { PlayList } from '../../data/models/Lists/PlayList.model';
import { Episode } from '../../data/models/Media/Episode.model';
import { Library } from '../../data/models/Media/Library.model';
import { Movie } from '../../data/models/Media/Movie.model';
import { Season } from '../../data/models/Media/Season.model';
import { Series } from '../../data/models/Media/Series.model';
import { Video } from '../../data/models/Media/Video.model';
import { Album } from '../../data/models/music/Album.model';
import { Artist } from '../../data/models/music/Artist.model';
import { Song } from '../../data/models/music/Song.model';
import {
  getAlbumById,
  getArtistById,
  getCollectionById,
  getEpisodeById,
  getLibraryById,
  getMovieById,
  getPlayListById,
  getSeasonById,
  getSeriesById,
  getSongById,
  getVideoById,
} from '../get/getData';
import { SequelizeManager } from '../SequelizeManager';

//#region Libraries

/**
 * Updates a Library record by ID.
 * @param id - The ID of the Library (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated Library record.
 */
export async function updateLibrary(
  id: string,
  data: Partial<LibraryData>
): Promise<Library> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await Library.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Library with ID ${id} not found`);
  }

  const updatedLibrary = await getLibraryById(id);

  if (!updatedLibrary) {
    throw new Error(`Failed to retrieve updated Library with ID ${id}`);
  }

  return updatedLibrary;
}

//#endregion

//#region Collections

/**
 * Updates a Collection record by ID.
 * @param id - The ID of the Collection (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated Collection record.
 */
export async function updateCollection(
  id: string,
  data: Partial<CollectionData>
): Promise<Collection> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await Collection.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Collection with ID ${id} not found`);
  }

  const updatedCollection = await getCollectionById(id);

  if (!updatedCollection) {
    throw new Error(`Failed to retrieve updated Collection with ID ${id}`);
  }

  return updatedCollection;
}

//#endregion

//#region Media

/**
 * Updates a Movie record by ID.
 * @param id - The ID of the Movie (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated Movie record.
 */
export async function updateMovie(
  id: string,
  data: Partial<MovieData>
): Promise<Movie> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await Movie.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Movie with ID ${id} not found`);
  }

  const updatedMovie = await getMovieById(id);

  if (!updatedMovie) {
    throw new Error(`Failed to retrieve updated Movie with ID ${id}`);
  }

  return updatedMovie;
}

/**
 * Updates a Series record by ID.
 * @param id - The ID of the Series (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated Series record.
 */
export async function updateSeries(
  id: string,
  data: Partial<SeriesData>
): Promise<Series> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await Series.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Series with ID ${id} not found`);
  }

  const updatedSeries = await getSeriesById(id);

  if (!updatedSeries) {
    throw new Error(`Failed to retrieve updated Series with ID ${id}`);
  }

  return updatedSeries;
}

/**
 * Updates a Season record by ID.
 * @param id - The ID of the Season (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated Season record.
 */
export async function updateSeason(
  id: string,
  data: Partial<SeasonData>
): Promise<Season> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await Season.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Season with ID ${id} not found`);
  }

  const updatedSeason = await getSeasonById(id);

  if (!updatedSeason) {
    throw new Error(`Failed to retrieve updated Season with ID ${id}`);
  }

  return updatedSeason;
}

/**
 * Updates an Episode record by ID.
 * @param id - The ID of the Episode (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated Episode record.
 */
export async function updateEpisode(
  id: string,
  data: Partial<EpisodeData>
): Promise<Episode> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await Episode.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Episode with ID ${id} not found`);
  }

  const updatedEpisode = await getEpisodeById(id);

  if (!updatedEpisode) {
    throw new Error(`Failed to retrieve updated Episode with ID ${id}`);
  }

  return updatedEpisode;
}

/**
 * Updates a Video record by ID.
 * @param id - The ID of the Video (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated Video record.
 */
export async function updateVideo(
  id: string,
  data: Partial<VideoData>
): Promise<Video> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await Video.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Video with ID ${id} not found`);
  }

  const updatedVideo = await getVideoById(id);

  if (!updatedVideo) {
    throw new Error(`Failed to retrieve updated Video with ID ${id}`);
  }

  return updatedVideo;
}

//#endregion

//#region Music

/**
 * Updates an Album record by ID.
 * @param id - The ID of the Album (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated Album record.
 */
export async function updateAlbum(
  id: string,
  data: Partial<Album>
): Promise<Album> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await Album.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Album with ID ${id} not found`);
  }

  const updatedAlbum = await getAlbumById(id);

  if (!updatedAlbum) {
    throw new Error(`Failed to retrieve updated Album with ID ${id}`);
  }

  return updatedAlbum;
}

/**
 * Updates a Song record by ID.
 * @param id - The ID of the Song (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated Song record.
 */
export async function updateSong(
  id: string,
  data: Partial<Song>
): Promise<Song> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await Song.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Song with ID ${id} not found`);
  }

  const updatedSong = await getSongById(id);

  if (!updatedSong) {
    throw new Error(`Failed to retrieve updated Song with ID ${id}`);
  }

  return updatedSong;
}

/**
 * Updates an Artist record by ID.
 * @param id - The ID of the Artist (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated Artist record.
 */
export async function updateArtist(
  id: string,
  data: Partial<Artist>
): Promise<Artist> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await Artist.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Artist with ID ${id} not found`);
  }

  const updatedArtist = await getArtistById(id);

  if (!updatedArtist) {
    throw new Error(`Failed to retrieve updated Artist with ID ${id}`);
  }

  return updatedArtist;
}

//#endregion

//#region Lists

/**
 * Updates a PlayList record by ID.
 * @param id - The ID of the PlayList (INTEGER).
 * @param data - Partial data to update.
 * @returns The updated PlayList record.
 */
export async function updatePlayList(
  id: string,
  data: Partial<PlayList>
): Promise<PlayList> {
  if (!SequelizeManager.sequelize) {
    throw new Error('Sequelize is not initialized');
  }

  const [affectedCount] = await PlayList.update(data, {
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`PlayList with ID ${id} not found`);
  }

  const updatedPlayList = await getPlayListById(id);

  if (!updatedPlayList) {
    throw new Error(`Failed to retrieve updated PlayList with ID ${id}`);
  }

  return updatedPlayList;
}

//#endregion
