import { Op } from "sequelize";
import { Collection } from "../../data/models/Collections/Collection.model";
import { ContinueWatching } from "../../data/models/Lists/ContinueWatching.model";
import { MyList } from "../../data/models/Lists/MyList.model";
import { PlayList } from "../../data/models/Lists/PlayList.model";
import { Episode } from "../../data/models/Media/Episode.model";
import { Library } from "../../data/models/Media/Library.model";
import { Movie } from "../../data/models/Media/Movie.model";
import { Season } from "../../data/models/Media/Season.model";
import { Series } from "../../data/models/Media/Series.model";
import { Video } from "../../data/models/Media/Video.model";
import { Album } from "../../data/models/music/Album.model";
import { Artist } from "../../data/models/music/Artist.model";
import { Song } from "../../data/models/music/Song.model";
import { getCollectionItemsKey, getItemModel } from "../../fileSearch/utils";
import { SequelizeManager } from "../SequelizeManager";

//#region Libraries

export const getLibraries = () => {
  if (!SequelizeManager.sequelize) return null;

  return Library.findAll({
    order: [["order", "ASC"]],
  });
};

/**
 * Retrieves items for a specific library based on the given type.
 * @param libraryId - The ID of the library.
 * @param type - The type of items to retrieve ('Movies', 'Shows', 'Music').
 * @returns A promise that resolves to an array of items (Movie[], Series[], or Album[]).
 */
export async function getItemsForLibrary(libraryId: string, type: string) {
  try {
    let items: Movie[] | Series[] | Album[] = [];

    if (type === "Movies") {
      items = await Movie.findAll({
        where: { libraryId },
        order: [
          ["order", "ASC"],
          ["name", "ASC"],
        ],
      });
    } else if (type === "Series" || type === "Shows") {
      items = await Series.findAll({
        where: { libraryId },
        order: [
          ["order", "ASC"],
          ["name", "ASC"],
        ],
      });
    } else if (type === "Music") {
      items = await Album.findAll({
        where: { libraryId },
        order: [
          ["order", "ASC"],
          ["title", "ASC"],
        ],
      });
    }

    return items;
  } catch (error) {
    console.error(
      `Error fetching items for library ${libraryId} (type: ${type}):`,
      error
    );
    return [];
  }
}

export const getLibraryById = async (id: string) => {
  if (!SequelizeManager.sequelize) return null;

  try {
    const library = await Library.findByPk(id);

    if (!library) {
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
    : await getMovieById(video.movieId ?? video.extraId ?? "");

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

export const getCollections = async () => {
  if (!SequelizeManager.sequelize) return null;

  return Collection.findAll();
};

export const getCollectionsInLibrary = async (
  libraryId: string,
  type: string
) => {
  const collectionItemsKey = getCollectionItemsKey(type);
  const ItemModel = getItemModel(type);

  return await Library.findByPk(libraryId, {
    include: [
      {
        model: Collection,
        as: "collections",
        include: [
          {
            model: ItemModel,
            as: collectionItemsKey,
            attributes: ["id", "coverSrc"],
          },
        ],
        through: {
          attributes: ["customOrder"],
        },
      },
    ],
  }).then((library) => library?.collections || []);
};

export const getCollectionById = async (id: string) => {
  if (!SequelizeManager.sequelize) return null;

  try {
    const colection = await Collection.findByPk(id, {
      include: [
        {
          model: Series,
          as: "shows",
          through: {
            attributes: ["custom_order"],
          },
        },
        {
          model: Movie,
          as: "movies",
          through: {
            attributes: ["custom_order"],
          },
        },
        {
          model: Album,
          as: "albums",
          through: {
            attributes: ["custom_order"],
          },
        },
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
    include: [
      {
        model: Season,
        as: "seasons",
      },
    ],
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
    include: [
      {
        model: Episode,
        as: "episodes",
        include: [{ model: Video, as: "video" }],
      },
    ],
  });
};

//#endregion

//#region Episodes

export const getEpisodes = (seasonId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Episode.findAll({
    where: {
      seasonId: seasonId,
    },
  });
};

export const getEpisodeById = (episodeId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Episode.findByPk(episodeId, {
    include: [{ model: Video, as: "video" }],
  });
};

export const getEpisodeByPath = async (videoSrc: string) => {
  if (!SequelizeManager.sequelize) return null;

  const video: Video | null = await Video.findOne({
    where: {
      videoSrc: videoSrc,
    },
  });

  if (!video || !video.episodeId) return null;

  return Episode.findByPk(video.episodeId);
};

//#endregion

//#region Videos

export const getVideoById = async (id: string) => {
  if (!SequelizeManager.sequelize) return null;

  return await Video.findByPk(id);
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

  return Video.findAll({
    where: {
      movieId,
    },
  });
};

export const getVideoByExtraId = (extraId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Video.findAll({
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
      { model: Video, as: "videos" },
      { model: Video, as: "extras" },
    ],
  });
};

export const getMovieByPath = async (videoSrc: string) => {
  if (!SequelizeManager.sequelize) return null;

  const video: Video | null = await Video.findOne({
    where: {
      videoSrc: videoSrc,
    },
  });

  if (!video || !video.episodeId) return null;

  return Movie.findByPk(video.movieId);
};

//#endregion

//#region Music

export const getAlbums = (libraryId: string) => {
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
      { model: Song, as: "songs" },
      { model: Artist, as: "artists" },
    ],
  });
};

export const getArtistById = (artistId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Artist.findByPk(artistId, {
    include: [{ model: Album, as: "albums" }],
  });
};

export const getSongs = (albumId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Song.findAll({
    where: {
      albumId,
    },
  });
};

export const getSongById = (songId: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Song.findByPk(songId);
};

export const getSongByPath = async (fileSrc: string) => {
  if (!SequelizeManager.sequelize) return null;

  return Song.findOne({
    where: {
      fileSrc: fileSrc,
    },
  });
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
    include: [{ model: Song, as: "songs" }],
  });
};

export const getSeriesInMyList = async () => {
  if (!SequelizeManager.sequelize) return null;

  try {
    // Get the IDs of the series saved in MyList
    const myListSeries = await MyList.findAll({
      where: {
        seriesId: {
          [Op.not]: null,
        },
      },
      attributes: ["seriesId"], // Only the ID
    });

    const seriesIds = myListSeries.map((item) => item.seriesId);

    if (seriesIds.length === 0) return [];

    // Search the series corresponding to those IDs
    const series = await Series.findAll({
      where: {
        id: {
          [Op.in]: seriesIds,
        },
      },
    });

    return series;
  } catch (error: any) {
    console.log(`Error fetching Series in My_List: ${error.message}`);
    return [];
  }
};

export const getMoviesInMyList = async () => {
  if (!SequelizeManager.sequelize) return null;

  try {
    // Get the IDs of the movies saved in MyList
    const myListMovies = await MyList.findAll({
      where: {
        movieId: {
          [Op.not]: null,
        },
      },
      attributes: ["movieId"], // Only the ID
    });

    const movieIds = myListMovies.map((item) => item.movieId);

    if (movieIds.length === 0) return [];

    // Search the movies corresponding to those IDs
    const movies = await Movie.findAll({
      where: {
        id: {
          [Op.in]: movieIds,
        },
      },
    });

    return movies;
  } catch (error: any) {
    console.log(`Error fetching Movies in My_List: ${error.message}`);
    return [];
  }
};

export const getSeriesFromMyList = async (seriesId: string) => {
  if (!SequelizeManager.sequelize) return null;

  try {
    return await MyList.findOne({
      where: {
        seriesId: seriesId,
      },
    });
  } catch (error: any) {
    console.log(`Error fetching My_List items: ${error.message}`);
    return null;
  }
};

export const getMovieFromMyList = async (movieId: string) => {
  if (!SequelizeManager.sequelize) return null;

  try {
    return await MyList.findOne({
      where: {
        movieId: movieId,
      },
    });
  } catch (error: any) {
    console.log(`Error fetching My_List items: ${error.message}`);
    return null;
  }
};

export const getContinueWatchingVideos = async () => {
  if (!SequelizeManager.sequelize) return null;

  try {
    const elements = await ContinueWatching.findAll({
      include: [
        {
          model: Video,
          as: "video",
          required: true,
          include: [
            {
              model: Episode,
              as: "episode",
              include: [
                {
                  model: Season,
                  as: "season",
                  include: [{ model: Series, as: "series" }],
                },
              ],
            },
            { model: Movie, as: "movie" },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Map to extract the videos with the necessary data
    const videos = elements
      .map((item) => {
        const itemVideo = item?.video;
        if (!itemVideo) return null;

        // Validate episode
        if (itemVideo.episode) {
          const episode = itemVideo.episode;
          const season = episode?.season;
          const series = season?.series;

          if (!episode || !season || !series) return null;

          return {
            id: item.id,
            title: series.name ?? "Not found",
            subtitle: episode.name,
            episodeNumber: episode.episodeNumber ?? 0,
            seasonNumber: episode.seasonNumber ?? 0,
            date: episode.year ?? "",
            duration: itemVideo.runtime ?? 0,
            timeWatched: itemVideo.timeWatched ?? 0,
            genres: series.genres ?? [],
            overview:
              episode.overview ?? season.overview ?? series.overview ?? "",
            backgroundImage: season.backgroundSrc,
            posterImage: series.coverSrc,
            logoImage: series.logoSrc,
            videoImage: itemVideo.imgSrc,
            episodeId: episode.id,
            videoId: itemVideo.id,
          };
        }

        // Validate movie
        if (itemVideo.movie) {
          const movie = itemVideo.movie;

          if (!movie) return null;

          return {
            id: item.id,
            title: movie.name ?? "Not found",
            date: movie.year ?? "",
            duration: itemVideo.runtime ?? 0,
            timeWatched: itemVideo.timeWatched ?? 0,
            genres: movie.genres ?? [],
            overview: movie.overview,
            backgroundImage: movie.backgroundSrc,
            posterImage: movie.coverSrc,
            logoImage: movie.logoSrc,
            videoImage: itemVideo.imgSrc,
            movieId: movie.id,
            videoId: itemVideo.id,
          };
        }

        return null;
      })
      .filter((video) => video !== null); // Filter nulls

    return videos;
  } catch (error: any) {
    console.log(`Error fetching Continue_Watching videos: ${error.message}`);
    return [];
  }
};

//#endregion
