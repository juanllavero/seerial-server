import { Collection } from '../../data/models/Collections/Collection.model';
import { ContinueWatching } from '../../data/models/Lists/ContinueWatching.model';
import { MyList } from '../../data/models/Lists/MyList.model';
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
import { SequelizeManager } from '../SequelizeManager';

//#region Libraries

export const getLibraries = () => {
  if (!SequelizeManager.sequelize) return null;

  return Library.findAll();
};

export const getLibraryById = async (id: string) => {
  if (!SequelizeManager.sequelize) return null;

  try {
    const library = await Library.findByPk(id, {
      include: [
        { model: Series, as: 'series' },
        { model: Movie, as: 'movies' },
        { model: Album, as: 'albums' },
        { model: Collection, as: 'collections' },
      ],
    });

    if (!library) {
      console.log(`Library with id ${id} not found`);
      return null;
    }

    return library;
  } catch (error: any) {
    console.log(`Error fetching library: ${error.message}`);
    return null;
  }
};

export const getLibraryByAlbumId = async (albumId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const album = await getAlbumById(albumId);

  if (!album) return null;

  return album.libraryId;
};

export const getLibraryByMovieId = async (movieId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const movie = await getMovieById(movieId);

  if (!movie) return null;

  return movie.libraryId;
};

export const getLibraryBySeriesId = async (seriesId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const series = await getSeriesById(seriesId);

  if (!series) return null;

  return series.libraryId;
};

export const getLibraryBySeasonId = async (seasonId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const season = await getSeasonById(seasonId);

  if (!season) return null;

  const series = await getSeriesById(season.seriesId);

  if (!series) return null;

  return series.libraryId;
};

export const getLibraryByVideoId = async (videoId: string) => {
  if (!SequelizeManager.sequelize) return null;

  const video = await getVideoById(videoId);

  if (!video) return null;

  let element: Episode | Movie | null = video.episodeId
    ? await getEpisodeById(video.episodeId)
    : await getMovieById(video.movieId ?? video.extraId ?? '');

  if (!element) return null;

  if (element instanceof Episode) {
    const season = await getSeasonById(element.seasonId);

    if (!season) return null;

    const series = await getSeriesById(season.seriesId);

    if (!series) return null;

    return series.libraryId;
  }

  return element.libraryId;
};

//#endregion

//#region Collections

export const getCollectionById = async (id: string) => {
  if (!SequelizeManager.sequelize) return null;

  try {
    const colection = await Collection.findByPk(id, {
      include: [
        { model: Series, as: 'shows' },
        { model: Movie, as: 'movies' },
        { model: Album, as: 'albums' },
      ],
    });

    if (!colection) {
      console.log(`Collection with id ${id} not found`);
      return null;
    }

    return colection;
  } catch (error: any) {
    console.log(`Error fetching collection: ${error.message}`);
    return null;
  }
};

//#endregion

//#region Series

export const getSeries = (libraryId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Series.findAll({
    where: {
      libraryId: libraryId,
    },
  });
};

export const getSeriesById = (seriesId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Series.findByPk(seriesId, {
    include: [{ model: Season, as: 'seasons' }],
  });
};

//#endregion

//#region Seasons

export const getSeasons = (seriesId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Season.findAll({
    where: {
      seriesId: seriesId,
    },
  });
};

export const getSeasonById = (seasonId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Season.findByPk(seasonId, {
    include: [{ model: Episode, as: 'episodes' }],
  });
};

//#endregion

//#region Episodes

export const getEpisode = (seasonId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Episode.findAll({
    where: {
      seasonId: seasonId,
    },
  });
};

export const getEpisodeById = (episodeId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Episode.findByPk(episodeId);
};

export const getEpisodeByPath = async (videoSrc: string) => {
  if (!SequelizeManager.sequelize) return null;

  const video: Video | null = await Video.findOne({
    where: {
      videoSrc: videoSrc,
    },
  });

  if (!video || !video.episodeId) return null;

  return Episode.findByPk(video.episodeId, {
    include: [{ model: Video, as: 'video' }],
  });
};

//#endregion

//#region Videos

export const getVideoById = (id: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Video.findByPk(id);
};

export const getVideoByEpisodeId = (episodeId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Video.findOne({
    where: {
      episodeId,
    },
  });
};

export const getVideoByMovieId = (movieId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Video.findOne({
    where: {
      movieId,
    },
  });
};

export const getVideoByExtraId = (extraId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Video.findOne({
    where: {
      extraId,
    },
  });
};

//#endregion

//#region Movies

export const getMovies = (libraryId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Movie.findAll({
    where: {
      libraryId: libraryId,
    },
  });
};

export const getMovieById = (movieId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Movie.findByPk(movieId, {
    include: [
      { model: Video, as: 'videos' },
      { model: Video, as: 'extras' },
    ],
  });
};

//#endregion

//#region Music

export const getAlbum = (libraryId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Album.findAll({
    where: {
      libraryId: libraryId,
    },
  });
};

export const getAlbumById = (albumId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Album.findByPk(albumId, {
    include: [
      { model: Song, as: 'songs' },
      { model: Artist, as: 'artists' },
    ],
  });
};

export const getArtistById = (artistId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Artist.findByPk(artistId, {
    include: [{ model: Album, as: 'albums' }],
  });
};

export const getSongById = (songId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Song.findByPk(songId);
};

//#endregion

//#region Lists

export const getPlayLists = () => {
  if (!SequelizeManager.sequelize) return null;

  return PlayList.findAll();
};

export const getPlayListById = (id: string) => {
  if (!SequelizeManager.sequelize) return null;

  return PlayList.findByPk(id, {
    include: [{ model: Song, as: 'songs' }],
  });
};

export const getMyList = async () => {
  if (!SequelizeManager.sequelize) return null;

  try {
    const myListItems = await MyList.findAll({
      include: [
        {
          model: Series,
          as: 'series',
          required: false, // Left join
        },
        {
          model: Movie,
          as: 'movie',
          required: false, // Left join
        },
      ],
    });

    return myListItems;
  } catch (error: any) {
    console.log(`Error fetching My_List items: ${error.message}`);
    return [];
  }
};

export const getContinueWatchingVideos = async () => {
  if (!SequelizeManager.sequelize) return null;

  try {
    const elements = await ContinueWatching.findAll({
      include: [
        {
          model: Video,
          as: 'video',
          required: true,
        },
      ],
    });

    // Map to extract only the Video instances
    const videos = elements
      .map((item) => item.video)
      .filter((video): video is Video => video !== null);

    return videos;
  } catch (error: any) {
    console.log(`Error fetching Continue_Watching videos: ${error.message}`);
    return [];
  }
};

//#endregion
