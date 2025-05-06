import { PlayList as PlayListData } from '../../data/interfaces/Lists';
import {
  Episode as EpisodeData,
  Library as LibraryData,
  Movie as MovieData,
  Season as SeasonData,
  Series as SeriesData,
  Video as VideoData,
} from '../../data/interfaces/Media';
import {
  Album as AlbumData,
  Artist as ArtistData,
  Song as SongData,
} from '../../data/interfaces/Music';
import { Collection } from '../../data/models/Collections/Collection.model';
import { CollectionAlbum } from '../../data/models/Collections/CollectionAlbum.model';
import { CollectionMovie } from '../../data/models/Collections/CollectionMovie.model';
import { CollectionSeries } from '../../data/models/Collections/CollectionSeries.model';
import { ContinueWatching } from '../../data/models/Lists/ContinueWatching.model';
import { MyList } from '../../data/models/Lists/MyList.model';
import { PlayList } from '../../data/models/Lists/PlayList.model';
import { PlayListItem } from '../../data/models/Lists/PlayListItem.model';
import { Episode } from '../../data/models/Media/Episode.model';
import { Library } from '../../data/models/Media/Library.model';
import { Movie } from '../../data/models/Media/Movie.model';
import { Season } from '../../data/models/Media/Season.model';
import { Series } from '../../data/models/Media/Series.model';
import { Video } from '../../data/models/Media/Video.model';
import { Album } from '../../data/models/music/Album.model';
import { AlbumArtist } from '../../data/models/music/AlbumArtist.model';
import { Artist } from '../../data/models/music/Artist.model';
import { Song } from '../../data/models/music/Song.model';
import { SequelizeManager } from '../SequelizeManager';

export const addLibrary = (library: Partial<LibraryData>) => {
  if (!SequelizeManager.sequelize) return null;

  console.log({ library });

  const newLibrary = new Library({ values: library });

  newLibrary.save();

  return newLibrary;
};

//#region Collections

export const addCollection = (title: string) => {
  if (!SequelizeManager.sequelize) return null;

  const existingCollection = Collection.findOne({
    where: {
      title,
    },
  });

  if (existingCollection) return existingCollection;

  const newCollection = new Collection({ values: { title } });

  newCollection.save();

  return newCollection;
};

export const addSeriesToCollection = (
  collectionId: string,
  seriesId: string
) => {
  if (!SequelizeManager.sequelize) return null;

  const newElement = new CollectionSeries({
    values: { collectionId, seriesId },
  });

  newElement.save();
};

export const addMovieToCollection = (collectionId: string, movieId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const newElement = new CollectionMovie({
    values: { collectionId, movieId },
  });

  newElement.save();
};

export const addAlbumToCollection = (collectionId: string, albumId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const newElement = new CollectionAlbum({
    values: { collectionId, albumId },
  });

  newElement.save();
};

//#endregion

//#region Media

export const addSeries = (series: Partial<SeriesData>) => {
  if (!SequelizeManager.sequelize) return null;

  const newSeries = new Series({ values: series });

  newSeries.save();

  return newSeries;
};

export const addMovie = (movie: Partial<MovieData>) => {
  if (!SequelizeManager.sequelize) return null;

  const newMovie = new Movie({ values: movie });

  newMovie.save();

  return newMovie;
};

export const addSeason = (season: Partial<SeasonData>) => {
  if (!SequelizeManager.sequelize) return null;

  const newSeason = new Season({ values: season });

  newSeason.save();

  return newSeason;
};

export const addEpisode = (episode: Partial<EpisodeData>) => {
  if (!SequelizeManager.sequelize) return null;

  const newEpisode = new Episode({ values: episode });

  newEpisode.save();

  return newEpisode;
};

export const addVideoAsMovie = (
  movieId: string,
  video?: Partial<VideoData>
) => {
  if (!SequelizeManager.sequelize) return null;

  const newVideo = new Video({
    values: {
      ...video,
      movieId,
    },
  });

  newVideo.save();

  return newVideo;
};

export const addVideoAsMovieExtra = (
  movieId: string,
  video?: Partial<VideoData>
) => {
  if (!SequelizeManager.sequelize) return null;

  const newVideo = new Video({
    values: {
      ...video,
      extraId: movieId,
    },
  });

  newVideo.save();

  return newVideo;
};

export const addVideoAsEpisode = (
  episodeId: string,
  video?: Partial<VideoData>
) => {
  if (!SequelizeManager.sequelize) return null;

  const newVideo = new Video({
    values: {
      ...video,
      episodeId,
    },
  });

  newVideo.save();

  return newVideo;
};

//#endregion

//#region Music

export const addAlbum = (album: Partial<AlbumData>) => {
  if (!SequelizeManager.sequelize) return null;

  const newAlbum = new Album({ values: album });

  newAlbum.save();

  return newAlbum;
};

export const addArtist = (artist: Partial<ArtistData>) => {
  if (!SequelizeManager.sequelize) return null;

  const existingArtist = Artist.findOne({
    where: {
      name: artist.name,
    },
  });

  if (existingArtist) return existingArtist;

  const newArtist = new Artist({ values: artist });

  newArtist.save();

  return newArtist;
};

export const addArtistToAlbum = (artistId: string, albumId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const newElement = new AlbumArtist({
    values: {
      artistId,
      albumId,
    },
  });

  newElement.save();
};

export const addSong = (song: Partial<SongData>) => {
  if (!SequelizeManager.sequelize) return null;

  const newSong = new Song({ values: song });

  newSong.save();

  return newSong;
};

//#endregion

//#region Lists

export const addPlaylist = (playList: Partial<PlayListData>) => {
  if (!SequelizeManager.sequelize) return null;

  const newPlayList = new PlayList({ values: playList });

  newPlayList.save();

  return newPlayList;
};

export const addSongToPlaylist = (playlistId: string, songId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const newPlayListItem = new PlayListItem({
    values: {
      playlistId,
      songId,
    },
  });

  newPlayListItem.save();
};

export const addSeriesToMyList = (seriesId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const newElement = new MyList({
    values: {
      seriesId,
    },
  });

  newElement.save();
};

export const addMovieToMyList = (movieId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const newElement = new MyList({
    values: {
      movieId,
    },
  });

  newElement.save();
};

export const addVideoToContinueWatching = (videoId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const newElement = new ContinueWatching({
    values: {
      videoId,
    },
  });

  newElement.save();
};

//#endregion
