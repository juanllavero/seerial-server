import { v4 as uuidv4 } from "uuid";
import { PlayList as PlayListData } from "../../data/interfaces/Lists";
import {
  Episode as EpisodeData,
  Library as LibraryData,
  Movie as MovieData,
  Season as SeasonData,
  Series as SeriesData,
  Video as VideoData,
} from "../../data/interfaces/Media";
import {
  Album as AlbumData,
  Artist as ArtistData,
  Song as SongData,
} from "../../data/interfaces/Music";
import { LibraryCollection } from "../../data/models";
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
import {
  getAlbumById,
  getEpisodeById,
  getMovieById,
  getPlayListById,
  getSeasonById,
  getSeriesById,
  getSongById,
  getVideoById,
} from "../get/getData";
import { SequelizeManager } from "../SequelizeManager";

//#region Library

export const addLibrary = async (library: Partial<LibraryData>) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  console.log({ library });

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    const libraryData = {
      ...library,
      id: uuidv4().split("-")[0],
    };

    try {
      // Verifica si el id ya existe
      const existingLibrary = await Library.findOne({
        where: { id: libraryData.id },
      });
      if (existingLibrary) {
        console.log(`Colisión de UUID: ${libraryData.id}. Reintentando...`);
        attempts++;
        continue;
      }

      const newLibrary = new Library(libraryData);
      console.log({ newLibrary });
      await newLibrary.save();
      console.log("Librería guardada:", newLibrary.toJSON());
      return newLibrary;
    } catch (error) {
      console.error(
        `Error al intentar guardar la librería (intento ${
          attempts + 1
        }/${maxAttempts}):`,
        error
      );
      attempts++;
      continue;
    }
  }

  console.error(
    "Error: No se pudo generar un UUID único después de varios intentos"
  );
  return null;
};

//#endregion

//#region Collections

export const addCollection = async (collection: Partial<Collection>) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si ya existe una colección con el mismo título
    if (collection.title) {
      const existingCollection = await Collection.findOne({
        where: {
          title: collection.title,
        },
      });

      if (existingCollection) {
        console.log(`Colección con título "${collection.title}" ya existe`);
        return existingCollection;
      }
    }

    // Genera un UUID para el id
    const collectionData = {
      ...collection,
      id: uuidv4().split("-")[0],
    };

    const newCollection = new Collection(collectionData);
    await newCollection.save();
    console.log("Colección guardada:", newCollection.toJSON());
    return newCollection;
  } catch (error) {
    console.error("Error al agregar la colección:", error);
    return null;
  }
};

export const addLibraryToCollection = async (
  libraryId: string,
  collectionId: string
) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si ya existe la relación
    const existingElement = await LibraryCollection.findOne({
      where: {
        libraryId,
        collectionId,
      },
    });

    if (existingElement) {
      console.log(
        `La biblioteca ${libraryId} ya está en la colección ${collectionId}`
      );
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      libraryId,
      collectionId,
    };

    const newElement = new LibraryCollection(newElementData);
    await newElement.save();
    console.log("Relación biblioteca-colección guardada:", newElement.toJSON());
    return newElement;
  } catch (error) {
    console.error("Error al agregar la biblioteca a la colección:", error);
    return null;
  }
};

export const addSeriesToCollection = async (
  collectionId: string,
  seriesId: string
) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si ya existe la relación
    const existingElement = await CollectionSeries.findOne({
      where: {
        collectionId,
        seriesId,
      },
    });

    if (existingElement) {
      console.log(
        `La serie ${seriesId} ya está en la colección ${collectionId}`
      );
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      collectionId,
      seriesId,
    };

    const newElement = new CollectionSeries(newElementData);
    await newElement.save();
    console.log("Relación serie-colección guardada:", newElement.toJSON());
    return newElement;
  } catch (error) {
    console.error("Error al agregar la serie a la colección:", error);
    return null;
  }
};

export const addMovieToCollection = async (
  collectionId: string,
  movieId: string
) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si ya existe la relación
    const existingElement = await CollectionMovie.findOne({
      where: {
        collectionId,
        movieId,
      },
    });

    if (existingElement) {
      console.log(
        `La película ${movieId} ya está en la colección ${collectionId}`
      );
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      collectionId,
      movieId,
    };

    const newElement = new CollectionMovie(newElementData);
    await newElement.save();
    console.log("Relación película-colección guardada:", newElement.toJSON());
    return newElement;
  } catch (error) {
    console.error("Error al agregar la película a la colección:", error);
    return null;
  }
};

export const addAlbumToCollection = async (
  collectionId: string,
  albumId: string
) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si ya existe la relación
    const existingElement = await CollectionAlbum.findOne({
      where: {
        collectionId,
        albumId,
      },
    });

    if (existingElement) {
      console.log(
        `El álbum ${albumId} ya está en la colección ${collectionId}`
      );
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      collectionId,
      albumId,
    };

    const newElement = new CollectionAlbum(newElementData);
    await newElement.save();
    console.log("Relación álbum-colección guardada:", newElement.toJSON());
    return newElement;
  } catch (error) {
    console.error("Error al agregar el álbum a la colección:", error);
    return null;
  }
};

//#endregion

//#region Media

export const addSeries = async (series: Partial<SeriesData>) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la serie ya existe
    if (series.id) {
      const existingSeries = await getSeriesById(series.id);
      if (existingSeries) {
        console.log(`La serie con ID ${series.id} ya existe`);
        return existingSeries;
      }
    }

    // Genera un UUID para el id
    const seriesData = {
      ...series,
      id: uuidv4().split("-")[0],
    };

    const newSeries = new Series(seriesData);
    await newSeries.save();
    console.log("Serie guardada:", newSeries.toJSON());
    return newSeries;
  } catch (error) {
    console.error("Error al agregar la serie:", error);
    return null;
  }
};

export const addMovie = async (movie: Partial<MovieData>) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la película ya existe
    if (movie.id) {
      const existingMovie = await getMovieById(movie.id);
      if (existingMovie) {
        console.log(`La película con ID ${movie.id} ya existe`);
        return existingMovie;
      }
    }

    // Genera un UUID para el id
    const movieData = {
      ...movie,
      id: uuidv4().split("-")[0],
    };

    const newMovie = new Movie(movieData);
    await newMovie.save();
    console.log("Película guardada:", newMovie.toJSON());
    return newMovie;
  } catch (error) {
    console.error("Error al agregar la película:", error);
    return null;
  }
};

export const addSeason = async (season: Partial<SeasonData>) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la temporada ya existe
    if (season.id) {
      const existingSeason = await getSeasonById(season.id);
      if (existingSeason) {
        console.log(`La temporada con ID ${season.id} ya existe`);
        return existingSeason;
      }
    }

    // Genera un UUID para el id
    const seasonData = {
      ...season,
      id: uuidv4().split("-")[0],
    };

    const newSeason = new Season(seasonData);
    await newSeason.save();
    console.log("Temporada guardada:", newSeason.toJSON());
    return newSeason;
  } catch (error) {
    console.error("Error al agregar la temporada:", error);
    return null;
  }
};

export const addEpisode = async (episode: Partial<EpisodeData>) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si el episodio ya existe
    if (episode.id) {
      const existingEpisode = await getEpisodeById(episode.id);
      if (existingEpisode) {
        console.log(`El episodio con ID ${episode.id} ya existe`);
        return existingEpisode;
      }
    }

    // Genera un UUID para el id
    const episodeData = {
      ...episode,
      id: uuidv4().split("-")[0],
    };

    const newEpisode = new Episode(episodeData);
    await newEpisode.save();
    console.log("Episodio guardado:", newEpisode.toJSON());
    return newEpisode;
  } catch (error) {
    console.error("Error al agregar el episodio:", error);
    return null;
  }
};

export const addVideoAsMovie = async (
  movieId: string,
  video?: Partial<VideoData>
) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si el video ya existe
    if (video && video.id) {
      const existingVideo = await getVideoById(video.id);
      if (existingVideo) {
        console.log(`El video con ID ${video.id} ya existe`);
        return existingVideo;
      }
    }

    // Genera un UUID para el id
    const videoData = {
      ...video,
      id: uuidv4().split("-")[0],
      movieId,
    };

    const newVideo = new Video(videoData);
    await newVideo.save();
    console.log("Video como película guardado:", newVideo.toJSON());
    return newVideo;
  } catch (error) {
    console.error("Error al agregar el video como película:", error);
    return null;
  }
};

export const addVideoAsMovieExtra = async (
  movieId: string,
  video?: Partial<VideoData>
) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si el video ya existe
    if (video && video.id) {
      const existingVideo = await getVideoById(video.id);
      if (existingVideo) {
        console.log(`El video con ID ${video.id} ya existe`);
        return existingVideo;
      }
    }

    // Genera un UUID para el id
    const videoData = {
      ...video,
      id: uuidv4().split("-")[0],
      extraId: movieId,
    };

    const newVideo = new Video(videoData);
    await newVideo.save();
    console.log("Video como extra de película guardado:", newVideo.toJSON());
    return newVideo;
  } catch (error) {
    console.error("Error al agregar el video como extra de película:", error);
    return null;
  }
};

export const addVideoAsEpisode = async (
  episodeId: string,
  video?: Partial<VideoData>
) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si el video ya existe
    if (video && video.id) {
      const existingVideo = await getVideoById(video.id);
      if (existingVideo) {
        console.log(`El video con ID ${video.id} ya existe`);
        return existingVideo;
      }
    }

    // Genera un UUID para el id
    const videoData = {
      ...video,
      id: uuidv4().split("-")[0],
      episodeId,
    };

    const newVideo = new Video(videoData);
    await newVideo.save();
    console.log("Video como episodio guardado:", newVideo.toJSON());
    return newVideo;
  } catch (error) {
    console.error("Error al agregar el video como episodio:", error);
    return null;
  }
};

//#endregion

//#region Music

export const addAlbum = async (album: Partial<AlbumData>) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si el álbum ya existe
    if (album.id) {
      const existingAlbum = await getAlbumById(album.id);
      if (existingAlbum) {
        console.log(`El álbum con ID ${album.id} ya existe`);
        return existingAlbum;
      }
    }

    // Genera un UUID para el id
    const albumData = {
      ...album,
      id: uuidv4().split("-")[0],
    };

    const newAlbum = new Album(albumData);
    await newAlbum.save();
    console.log("Álbum guardado:", newAlbum.toJSON());
    return newAlbum;
  } catch (error) {
    console.error("Error al agregar el álbum:", error);
    return null;
  }
};

export const addArtist = async (artist: Partial<ArtistData>) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si el artista ya existe
    if (artist.name) {
      const existingArtist = await Artist.findOne({
        where: {
          name: artist.name,
        },
      });

      if (existingArtist) {
        console.log(`El artista con nombre "${artist.name}" ya existe`);
        return existingArtist;
      }
    }

    // Genera un UUID para el id
    const artistData = {
      ...artist,
      id: uuidv4().split("-")[0],
    };

    const newArtist = new Artist(artistData);
    await newArtist.save();
    console.log("Artista guardado:", newArtist.toJSON());
    return newArtist;
  } catch (error) {
    console.error("Error al agregar el artista:", error);
    return null;
  }
};

export const addArtistToAlbum = async (artistId: string, albumId: string) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la relación ya existe
    const existingElement = await AlbumArtist.findOne({
      where: {
        artistId,
        albumId,
      },
    });

    if (existingElement) {
      console.log(
        `El artista ${artistId} ya está asociado al álbum ${albumId}`
      );
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      artistId,
      albumId,
    };

    const newElement = new AlbumArtist(newElementData);
    await newElement.save();
    console.log("Relación artista-álbum guardada:", newElement.toJSON());
    return newElement;
  } catch (error) {
    console.error("Error al agregar el artista al álbum:", error);
    return null;
  }
};

export const addSong = async (song: Partial<SongData>) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la canción ya existe
    if (song.id) {
      const existingSong = await getSongById(song.id);
      if (existingSong) {
        console.log(`La canción con ID ${song.id} ya existe`);
        return existingSong;
      }
    }

    // Genera un UUID para el id
    const songData = {
      ...song,
      id: uuidv4().split("-")[0],
    };

    const newSong = new Song(songData);
    await newSong.save();
    console.log("Canción guardada:", newSong.toJSON());
    return newSong;
  } catch (error) {
    console.error("Error al agregar la canción:", error);
    return null;
  }
};

//#endregion

//#region Lists

export const addPlaylist = async (playList: Partial<PlayListData>) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la lista de reproducción ya existe
    if (playList.id) {
      const existingPlayList = await getPlayListById(playList.id);
      if (existingPlayList) {
        console.log(`La lista de reproducción con ID ${playList.id} ya existe`);
        return existingPlayList;
      }
    }

    // Genera un UUID para el id
    const playListData = {
      ...playList,
      id: uuidv4().split("-")[0],
    };

    const newPlayList = new PlayList(playListData);
    await newPlayList.save();
    console.log("Lista de reproducción guardada:", newPlayList.toJSON());
    return newPlayList;
  } catch (error) {
    console.error("Error al agregar la lista de reproducción:", error);
    return null;
  }
};

export const addSongToPlaylist = async (playlistId: string, songId: string) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la relación ya existe
    const existingElement = await PlayListItem.findOne({
      where: {
        playlistId,
        songId,
      },
    });

    if (existingElement) {
      console.log(
        `La canción ${songId} ya está en la lista de reproducción ${playlistId}`
      );
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      playlistId,
      songId,
    };

    const newPlayListItem = new PlayListItem(newElementData);
    await newPlayListItem.save();
    console.log(
      "Relación canción-lista de reproducción guardada:",
      newPlayListItem.toJSON()
    );
    return newPlayListItem;
  } catch (error) {
    console.error(
      "Error al agregar la canción a la lista de reproducción:",
      error
    );
    return null;
  }
};

export const removeSongFromPlaylist = async (
  playlistId: string,
  songId: string
) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la relacion ya existe
    const existingElement = await PlayListItem.findOne({
      where: {
        playlistId,
        songId,
      },
    });

    if (!existingElement) {
      console.log(
        `La canción ${songId} no estaba en la lista de reproducción ${playlistId}`
      );
      return existingElement;
    }

    await existingElement.destroy();
    console.log(
      "Relación canción-lista de reproducción eliminada:",
      existingElement.toJSON()
    );
    return existingElement;
  } catch (error) {
    console.error(
      "Error al eliminar la canción de la lista de reproducción:",
      error
    );
    return null;
  }
};

export const addSeriesToMyList = async (seriesId: string) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la serie ya está en la lista
    const existingElement = await MyList.findOne({
      where: {
        seriesId,
      },
    });

    if (existingElement) {
      console.log(`La serie ${seriesId} ya está en Mi Lista`);
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      seriesId,
    };

    const newElement = new MyList(newElementData);
    await newElement.save();
    console.log("Serie agregada a Mi Lista:", newElement.toJSON());
    return newElement;
  } catch (error) {
    console.error("Error al agregar la serie a Mi Lista:", error);
    return null;
  }
};

export const removeSeriesFromMyList = async (seriesId: string) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la serie ya estaba en la lista
    const existingElement = await MyList.findOne({
      where: {
        seriesId,
      },
    });

    if (!existingElement) {
      console.log(`La serie ${seriesId} no estaba en Mi Lista`);
      return existingElement;
    }

    await existingElement.destroy();
    console.log("Serie eliminada de Mi Lista:", existingElement.toJSON());
    return existingElement;
  } catch (error) {
    console.error("Error al eliminar la serie de Mi Lista:", error);
    return null;
  }
};

export const addMovieToMyList = async (movieId: string) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la película ya está en la lista
    const existingElement = await MyList.findOne({
      where: {
        movieId,
      },
    });

    if (existingElement) {
      console.log(`La película ${movieId} ya está en Mi Lista`);
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      movieId,
    };

    const newElement = new MyList(newElementData);
    await newElement.save();
    console.log("Película agregada a Mi Lista:", newElement.toJSON());
    return newElement;
  } catch (error) {
    console.error("Error al agregar la película a Mi Lista:", error);
    return null;
  }
};

export const removeMovieFromMyList = async (movieId: string) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si la película ya estaba en la lista
    const existingElement = await MyList.findOne({
      where: {
        movieId,
      },
    });

    if (!existingElement) {
      console.log(`La película ${movieId} no estaba en Mi Lista`);
      return existingElement;
    }

    await existingElement.destroy();
    console.log("Película eliminada de Mi Lista:", existingElement.toJSON());
    return existingElement;
  } catch (error) {
    console.error("Error al eliminar la película de Mi Lista:", error);
    return null;
  }
};

export const addVideoToContinueWatching = async (videoId: string) => {
  if (!SequelizeManager.sequelize) {
    console.error("Error: Sequelize no está inicializado");
    return null;
  }

  try {
    // Verifica si el video ya está en Continue Watching
    const existingElement = await ContinueWatching.findOne({
      where: {
        videoId,
      },
    });

    if (existingElement) {
      console.log(`El video ${videoId} ya está en Continue Watching`);
      return existingElement;
    }

    // Genera un UUID para el id
    const newElementData = {
      id: uuidv4().split("-")[0],
      videoId,
    };

    const newElement = new ContinueWatching(newElementData);
    await newElement.save();
    console.log("Video agregado a Continue Watching:", newElement.toJSON());
    return newElement;
  } catch (error) {
    console.error("Error al agregar el video a Continue Watching:", error);
    return null;
  }
};

//#endregion
