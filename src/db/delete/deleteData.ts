import fs from "fs-extra";
import path from "path";
import {
  Movie as MovieData,
  Season as SeasonData,
  Series as SeriesData,
  Video as VideoData,
} from "../../data/interfaces/Media";
import { Collection } from "../../data/models/Collections/Collection.model";
import { CollectionAlbum } from "../../data/models/Collections/CollectionAlbum.model";
import { CollectionMovie } from "../../data/models/Collections/CollectionMovie.model";
import { CollectionSeries } from "../../data/models/Collections/CollectionSeries.model";
import { ContinueWatching } from "../../data/models/Lists/ContinueWatching.model";
import { MyList } from "../../data/models/Lists/MyList.model";
import { PlayList } from "../../data/models/Lists/PlayList.model";
import { PlayListItem } from "../../data/models/Lists/PlayListItem.model";
import { Episode } from "../../data/models/Media/Episode.model";
import { Library } from "../../data/models/Media/Library.model";
import { Movie } from "../../data/models/Media/Movie.model";
import { Season } from "../../data/models/Media/Season.model";
import { Series } from "../../data/models/Media/Series.model";
import { Video } from "../../data/models/Media/Video.model";
import { Album } from "../../data/models/music/Album.model";
import { AlbumArtist } from "../../data/models/music/AlbumArtist.model";
import { Artist } from "../../data/models/music/Artist.model";
import { Song } from "../../data/models/music/Song.model";
import { SequelizeManager } from "../SequelizeManager";
import {
  getLibraryById,
  getLibraryBySeasonId,
  getLibraryByVideoId,
  getSeasonById,
  getSeriesById,
  getVideoById,
} from "../get/getData";

/**
 * Deletes a Library record by ID.
 * @param id - The ID of the Library (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteLibrary(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await Library.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Library with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes a Movie record by ID.
 * @param id - The ID of the Movie (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteMovie(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await Movie.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Movie with ID ${id} not found`);
  }

  return true;
}

export async function deleteMovieData(libraryId: string, movie: MovieData) {
  try {
    await fs.remove(
      path.join("resources", "img", "backgrounds", movie.id ?? "")
    );
    await fs.remove(path.join("resources", "img", "posters", movie.id ?? ""));
    await fs.remove(path.join("resources", "img", "logos", movie.id ?? ""));
  } catch (error) {
    console.error(
      "deleteSeriesData: Error deleting cover images directory",
      error
    );
  }

  const library = await getLibraryById(libraryId);

  await library?.removeAnalyzedFolder(movie.folder);
}

/**
 * Deletes a Series record by ID.
 * @param id - The ID of the Series (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteSeries(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const series = await getSeriesById(id);

  if (!series) return false;

  const library = await getLibraryById(series.libraryId);

  if (!library) return false;

  deleteSeriesData(library.id, series);

  const affectedCount = await Series.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Series with ID ${id} not found`);
  }

  return true;
}

// Delete show stored data
export async function deleteSeriesData(libraryId: string, series: SeriesData) {
  try {
    await fs.remove(path.join("resources", "img", "posters", series.id ?? ""));
    await fs.remove(path.join("resources", "img", "logos", series.id ?? ""));
  } catch (error) {
    console.error(
      "deleteSeriesData: Error deleting cover images directory",
      error
    );
  }

  const library = await getLibraryById(libraryId);

  await library?.removeAnalyzedFolder(series.folder);
}

/**
 * Deletes a Season record by ID.
 * @param id - The ID of the Season (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteSeason(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const libraryId = await getLibraryBySeasonId(id);

  if (!libraryId) return false;

  const season = await getSeasonById(id);

  if (!season) return false;

  deleteSeasonData(season);

  const affectedCount = await Season.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Season with ID ${id} not found`);
  }

  return true;
}

// Delete season stored data
export async function deleteSeasonData(season: SeasonData) {
  try {
    await fs.remove(
      path.join("resources", "img", "backgrounds", season.id ?? "")
    );
    await fs.remove(path.join("resources", "img", "logos", season.id ?? ""));
    await fs.remove(path.join("resources", "img", "posters", season.id ?? ""));

    if (season.musicSrc) {
      await fs.remove(season.musicSrc);
    }
    if (season.videoSrc) {
      await fs.remove(season.videoSrc);
    }
  } catch (error) {
    console.error(
      "deleteSeasonData: Error deleting images files and directories",
      error
    );
  }
}

/**
 * Deletes an Episode record by ID.
 * @param id - The ID of the Episode (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteEpisode(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await Episode.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Episode with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes a Video record by ID.
 * @param id - The ID of the Video (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteVideo(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const libraryId = await getLibraryByVideoId(id);

  if (!libraryId) return false;

  const video = await getVideoById(id);

  if (!video) return false;

  deleteVideoData(libraryId, video);

  const affectedCount = await Video.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Video with ID ${id} not found`);
  }

  return true;
}

export async function deleteVideoData(libraryId: string, video: VideoData) {
  try {
    await fs.remove(
      path.join("resources", "img", "thumbnails", "video", video.id ?? "")
    );
    await fs.remove(
      path.join("resources", "img", "thumbnails", "chapters", video.id ?? "")
    );
  } catch (error) {
    console.error(
      "deleteVideoData: Error deleting directory: resources/img/discCovers/" +
        video.id,
      error
    );
  }

  const library = await getLibraryById(libraryId);

  if (library && video) await library.removeAnalyzedFile(video.fileSrc);
}

/**
 * Deletes a Collection record by ID.
 * @param id - The ID of the Collection (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteCollection(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await Collection.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Collection with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes a CollectionSeries record by composite key (collectionId, seriesId).
 * @param collectionId - The ID of the Collection (STRING).
 * @param seriesId - The ID of the Series (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteCollectionSeries(
  collectionId: number,
  seriesId: number
): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await CollectionSeries.destroy({
    where: { collectionId, seriesId },
  });

  if (affectedCount === 0) {
    throw new Error(
      `CollectionSeries with collectionId ${collectionId} and seriesId ${seriesId} not found`
    );
  }

  return true;
}

/**
 * Deletes a CollectionMovie record by composite key (collectionId, movieId).
 * @param collectionId - The ID of the Collection (STRING).
 * @param movieId - The ID of the Movie (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteCollectionMovie(
  collectionId: number,
  movieId: number
): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await CollectionMovie.destroy({
    where: { collectionId, movieId },
  });

  if (affectedCount === 0) {
    throw new Error(
      `CollectionMovie with collectionId ${collectionId} and movieId ${movieId} not found`
    );
  }

  return true;
}

/**
 * Deletes a CollectionAlbum record by composite key (collectionId, albumId).
 * @param collectionId - The ID of the Collection (STRING).
 * @param albumId - The ID of the Album (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteCollectionAlbum(
  collectionId: number,
  albumId: number
): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await CollectionAlbum.destroy({
    where: { collectionId, albumId },
  });

  if (affectedCount === 0) {
    throw new Error(
      `CollectionAlbum with collectionId ${collectionId} and albumId ${albumId} not found`
    );
  }

  return true;
}

/**
 * Deletes an Album record by ID.
 * @param id - The ID of the Album (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteAlbum(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await Album.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Album with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes a Song record by ID.
 * @param id - The ID of the Song (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteSong(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await Song.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Song with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes an Artist record by ID.
 * @param id - The ID of the Artist (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteArtist(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await Artist.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`Artist with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes an AlbumArtist record by composite key (albumId, artistId).
 * @param albumId - The ID of the Album (STRING).
 * @param artistId - The ID of the Artist (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteAlbumArtist(
  albumId: number,
  artistId: number
): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await AlbumArtist.destroy({
    where: { albumId, artistId },
  });

  if (affectedCount === 0) {
    throw new Error(
      `AlbumArtist with albumId ${albumId} and artistId ${artistId} not found`
    );
  }

  return true;
}

/**
 * Deletes a PlayList record by ID.
 * @param id - The ID of the PlayList (STRING).
 * @returns True if deletion is successful.
 */
export async function deletePlayList(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await PlayList.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`PlayList with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes a PlayListItem record by ID.
 * @param id - The ID of the PlayListItem (STRING).
 * @returns True if deletion is successful.
 */
export async function deletePlayListItem(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await PlayListItem.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`PlayListItem with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes a MyList record by ID.
 * @param id - The ID of the MyList (STRING, UUID).
 * @returns True if deletion is successful.
 */
export async function deleteFromMyList(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await MyList.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`MyList with ID ${id} not found`);
  }

  return true;
}

/**
 * Deletes a ContinueWatching record by ID.
 * @param id - The ID of the ContinueWatching (STRING).
 * @returns True if deletion is successful.
 */
export async function deleteFromContinueWatching(id: string): Promise<boolean> {
  if (!SequelizeManager.sequelize) {
    throw new Error("Sequelize is not initialized");
  }

  const affectedCount = await ContinueWatching.destroy({
    where: { id },
  });

  if (affectedCount === 0) {
    throw new Error(`ContinueWatching with ID ${id} not found`);
  }

  return true;
}
