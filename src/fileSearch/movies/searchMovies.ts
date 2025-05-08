import fs from "fs-extra";
import { MovieResponse } from "moviedb-promise";
import { wsManager } from "../..";
import { Collection } from "../../data/models/Collections/Collection.model";
import { Library } from "../../data/models/Media/Library.model";
import { Movie } from "../../data/models/Media/Movie.model";
import { Video } from "../../data/models/Media/Video.model";
import { getVideoById } from "../../db/get/getData";
import {
  addCollection,
  addLibraryToCollection,
  addMovie,
  addMovieToCollection,
  addVideoAsMovie,
} from "../../db/post/postData";
import { MovieDBWrapper } from "../../theMovieDB/MovieDB";
import { FilesManager } from "../../utils/FilesManager";
import { IMDBScores } from "../../utils/IMDBScores";
import { Utils } from "../../utils/Utils";
import { WebSocketManager } from "../../WebSockets/WebSocketManager";
import { FileSearch } from "../fileSearch";

/**
 * Scans a specific folder for movies and collections
 * @param root Root folder/file to search into
 * @param wsManager WebSocket Manager to communicate with the client apps
 */
export async function scanMovie(
  library: Library,
  root: string,
  wsManager: WebSocketManager
) {
  if (!(await Utils.isFolder(root))) {
    // ONLY ONE FILE
    if (!Utils.isVideoFile(root)) return;

    await processFolder(library, root, [root]);
  } else {
    const filesInDir = await Utils.getFilesInFolder(root);
    const filesInRoot: string[] = [];
    const folders: string[] = [];

    for (const file of filesInDir) {
      const filePath = `${root}/${file.name}`;
      if (await Utils.isFolder(filePath)) {
        folders.push(filePath);
      } else {
        if (Utils.isVideoFile(filePath)) filesInRoot.push(filePath);
      }
    }

    if (folders.length > 0) {
      // FOLDERS CORRESPONDING DIFFERENT MOVIES FROM A COLLECTION

      // Add collection or retrieve existing one
      const collection = await addCollection({
        title: Utils.getFileName(root),
      });

      if (collection) {
        await addLibraryToCollection(library.id, collection.id);
      }

      // Add collection to view
      //Utils.addSeries(wsManager, library.id, collection);

      const processPromises = folders.map(async (folder) => {
        const files = await Utils.getValidVideoFiles(folder);
        await processFolder(library, folder, files, collection ?? undefined);
      });

      await Promise.all(processPromises);
    } else {
      // MOVIE FILE/CONCERT FILES INSIDE FOLDER
      await processFolder(library, root, filesInRoot);
    }
  }

  // Save data in DB
  library.save();
}

/**
 * Processes the files inside the movie folder, creating the Movie object and searching for metadata
 * @param rootFolder Root folder of the movie
 * @param files Video files inside the root folder
 * @param collection Collection from the movie
 */
export async function processFolder(
  library: Library,
  rootFolder: string,
  files: string[],
  collection?: Collection
) {
  const fileFullName = Utils.getFileName(rootFolder);
  const nameAndYear = Utils.extractNameAndYear(fileFullName);

  let name = nameAndYear[0];
  let year = nameAndYear[1];

  const movieMetadata = await searchMovie(name, year, library.language);

  let movie = await addMovie({
    libraryId: library.id,
    folder: rootFolder,
  });

  if (!movie) return;

  await library.addAnalyzedFolder(rootFolder, movie.id);

  if (collection) {
    addMovieToCollection(collection.id, movie.id);
  }

  if (!movieMetadata) {
    //Save videos without metadata
    movie.name = name;
    movie.year = year !== "1" ? year : "";

    // Add movie to view
    //Utils.addSeason(wsManager, library.id, movie);

    const processPromises = files.map(async (file) => {
      await saveMovieWithoutMetadata(library, movie, file, wsManager);
    });

    await Promise.all(processPromises);

    //show.analyzingFiles = false;

    // Update show in view
    //Utils.updateSeries(wsManager, library.id, show);
    return;
  }

  await setMovieMetadata(library, movie, movieMetadata, name, year);

  // Add movie to view
  //Utils.addSeason(wsManager, library.id, movie);

  const processPromises = files.map(async (file) => {
    await processVideo(library, movie, file, wsManager);
  });

  await Promise.all(processPromises);

  // Save data in DB
  library.save();

  //show.analyzingFiles = false;

  // Update show in view
  //Utils.updateSeries(wsManager, library.id, show);
}

/**
 * Searches in TheMovieDB for a specific movie name and year and returns the first match
 * @param name Title of the movie
 * @param year Release year of the movie
 * @returns The first result of the search
 */
export async function searchMovie(
  name: string,
  year: string,
  language: string
) {
  const moviesSearch = await MovieDBWrapper.searchMovies(name, year, 1);

  return moviesSearch && moviesSearch.length > 0
    ? await MovieDBWrapper.getMovie(moviesSearch[0].id ?? 0, language)
    : undefined;
}

/**
 * Sets the metadata from TheMovieDB to the Movie object
 * @param movie Movie object
 * @param movieMetadata Metadata from TheMovieDB
 * @param name Name of the movie
 * @param year Release date of the movie
 * @param collection The collection the movie is in, if it is
 */
export async function setMovieMetadata(
  library: Library,
  movie: Movie,
  movieMetadata: MovieResponse,
  name: string,
  year: string,
  collection?: Collection
) {
  movie.name = !movie.nameLock ? movieMetadata.title ?? name : name;
  movie.year = !movie.yearLock ? movieMetadata.release_date ?? year : year;
  movie.overview = !movie.overviewLock ? movieMetadata.overview ?? "" : "";
  movie.tagline = !movie.taglineLock ? movieMetadata.tagline ?? "" : "";
  movie.themdbId = movieMetadata.id ?? -1;
  movie.imdbId = movieMetadata.imdb_id ?? "-1";
  movie.score = movieMetadata.vote_average
    ? (movieMetadata.vote_average * 10) / 10
    : 0;
  movie.genres =
    movie.genresLock && movie.genres
      ? movie.genres
      : movieMetadata.genres
      ? movieMetadata.genres.map((genre) => genre.name ?? "")
      : [];
  movie.productionStudios = movie.productionStudiosLock
    ? movie.productionStudios
    : movieMetadata.production_companies
    ? movieMetadata.production_companies.map((company) => company.name ?? "")
    : [];

  // Get IMDB Score for Movie
  movie.imdbScore = await IMDBScores.getIMDBScore(movie.imdbId);

  //#region GET TAGS
  const credits = await MovieDBWrapper.getMovieCredits(
    movie.themdbId,
    library.language
  );

  if (credits) {
    console.log({ credits });
    if (credits.crew) {
      if (!movie.directedByLock && movie.directedBy) {
        movie.directedBy.splice(0, movie.directedBy.length);
        for (const person of credits.crew) {
          console.log({ person });
          if (person.name && person.job === "Director" && movie.directedBy)
            movie.directedBy = [...movie.directedBy, person.name];
        }
      }

      if (!movie.writtenByLock && movie.writtenBy) {
        movie.writtenBy.splice(0, movie.writtenBy.length);
        for (const person of credits.crew) {
          if (
            person.name &&
            (person.job === "Writer" || person.job === "Novel") &&
            movie.writtenBy
          )
            movie.writtenBy = [...movie.writtenBy, person.name];
        }
      }

      if (!movie.creatorLock && movie.creator && movie.creator.length > 0)
        movie.creator.splice(0, movie.creator.length);

      if (
        !movie.musicComposerLock &&
        movie.musicComposer &&
        movie.musicComposer.length > 0
      )
        movie.musicComposer.splice(0, movie.musicComposer.length);

      for (const person of credits.crew) {
        if (
          !movie.creatorLock &&
          person.job &&
          (person.job === "Author" ||
            person.job === "Novel" ||
            person.job === "Original Series Creator" ||
            person.job === "Comic Book" ||
            person.job === "Idea" ||
            person.job === "Original Story" ||
            person.job === "Story" ||
            person.job === "Story by" ||
            person.job === "Book" ||
            person.job === "Original Concept")
        )
          if (person.name && !movie.creatorLock && movie.creator)
            movie.creator = [...movie.creator, person.name];

        if (
          !movie.musicComposerLock &&
          person.job &&
          person.job === "Original Music Composer"
        )
          if (person.name && !movie.musicComposerLock && movie.musicComposer)
            movie.musicComposer = [...movie.musicComposer, person.name];
      }
    }

    if (credits.cast) {
      if (movie.cast && movie.cast.length > 0)
        movie.cast.splice(0, movie.cast.length);

      for (const person of credits.cast) {
        movie.cast = [
          ...movie.cast,
          {
            name: person.name ?? "",
            character: person.character ?? "",
            profileImage: person.profile_path
              ? `${FileSearch.BASE_URL}${person.profile_path}`
              : "",
          },
        ];
      }
    }
  }
  //#endregion

  //#region IMAGES DOWNLOAD
  const images = await MovieDBWrapper.getMovieImages(movie.themdbId);

  if (images) {
    const logos = images.logos || [];
    const posters = images.posters || [];
    const backdrops = images.backdrops || [];

    // Create folders if they do not exist
    const outputLogosDir = FilesManager.getExternalPath(
      "resources/img/logos/" + movie.id
    );
    if (!fs.existsSync(outputLogosDir)) {
      fs.mkdirSync(outputLogosDir);
    }

    const outputPostersDir = FilesManager.getExternalPath(
      "resources/img/posters/" + movie.id
    );
    if (!fs.existsSync(outputPostersDir)) {
      fs.mkdirSync(outputPostersDir);
    }

    const outputPostersCollectionDir = FilesManager.getExternalPath(
      "resources/img/posters/" + collection?.id
    );

    if (collection) {
      if (!fs.existsSync(outputPostersCollectionDir)) {
        fs.mkdirSync(outputPostersCollectionDir);
      }
    }

    const outputImageDir = FilesManager.getExternalPath(
      "resources/img/backgrounds/" + movie.id
    );
    if (!fs.existsSync(outputImageDir)) {
      fs.mkdirSync(outputImageDir);
    }

    // Download backgrounds
    for (const backdrop of backdrops) {
      if (backdrop.file_path) {
        const backgroundUrl = `${FileSearch.BASE_URL}${backdrop.file_path}`;
        movie.backgroundsUrls = [...movie.backgroundsUrls, backgroundUrl];

        if (movie.backgroundSrc === "") {
          movie.backgroundSrc = backgroundUrl;
        }
      }
    }

    // Download logos
    for (const logo of logos) {
      if (logo.file_path) {
        const logoUrl = `${FileSearch.BASE_URL}${logo.file_path}`;
        movie.logosUrls = [...movie.logosUrls, logoUrl];

        if (movie.logoSrc === "") {
          movie.logoSrc = logoUrl;
        }
      }
    }

    // Download posters
    for (const poster of posters) {
      if (poster.file_path) {
        const posterUrl = `${FileSearch.BASE_URL}${poster.file_path}`;
        movie.coversUrls = [...movie.coversUrls, posterUrl];

        if (movie.coverSrc === "") {
          movie.coverSrc = posterUrl;
        }

        if (collection) {
          collection.postersUrls = [...collection.postersUrls, posterUrl];
          if (collection.posterSrc === "") {
            collection.posterSrc = posterUrl;
          }
        }
      }
    }
  }
  //#endregion

  // Save data in DB
  collection?.save();
  movie.save();
}

/**
 * Processes the video file associated to a movie without any metadata from TheMovieDB
 * @param movie Movie object
 * @param filePath Path to the video file
 * @param wsManager WebSocket Manager to update the info in the client apps
 */
export async function saveMovieWithoutMetadata(
  library: Library,
  movie: Movie,
  filePath: string,
  wsManager: WebSocketManager
) {
  let video = await addVideoAsMovie(movie.id);

  if (!video) return;

  video.movieId = movie.id;

  if (filePath in library.analyzedFiles) {
    video = await getVideoById(library.analyzedFiles[filePath] ?? "");
  }

  if (!video) return;

  await library.addAnalyzedFile(filePath, video.id);

  video.fileSrc = filePath;
  video.imgSrc = "resources/img/Default_video_thumbnail.jpg";

  // Save data in DB
  movie.save();
  video.save();

  // Add episode to view
  //Utils.addEpisode(wsManager, library.id, movie.seriesID, episode);
}

/**
 * Processes the video file associated to a movie
 * @param movie Movie object
 * @param filePath Path to the video file
 * @param wsManager WebSocket Manager to update the info in the client apps
 */
export async function processVideo(
  library: Library,
  movie: Movie,
  filePath: string,
  wsManager: WebSocketManager
) {
  let video: Video | null;

  if (filePath in library.analyzedFiles) {
    video = await getVideoById(library.analyzedFiles[filePath] ?? "");
  } else {
    video = await addVideoAsMovie(movie.id, {
      fileSrc: filePath,
      movieId: movie.id,
    });

    if (!video) return;

    await library.addAnalyzedFile(filePath, video.id);

    console.log({ filePath, id: video.id, files: library.analyzedFiles });
  }

  if (!video) return;

  const images = await MovieDBWrapper.getMovieImages(movie.themdbId);

  let thumbnails = images?.backdrops || [];

  const outputDir = FilesManager.getExternalPath(
    "resources/img/thumbnails/video/" + video.id + "/"
  );
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Download thumbnails
  for (const [index, thumbnail] of thumbnails.entries()) {
    if (thumbnail.file_path) {
      const url = `${FileSearch.BASE_URL}${thumbnail.file_path}`;
      video.imgUrls = [...video.imgUrls, url];

      if (index === 0) {
        video.imgSrc = url;
      }
    }
  }

  // Save data in DB
  video.save();

  // Add episode to view
  //Utils.addEpisode(wsManager, library.id, movie.id, video);
}

/**
 * Processes the video file associated to a movie extra
 * @param movie Movie object
 * @param filePath Path to the video file
 * @param wsManager WebSocket Manager to update the info in the client apps
 */
export async function processVideoAsExtra(
  library: Library,
  movie: Movie,
  filePath: string,
  wsManager: WebSocketManager
) {
  let video: Video | null;

  if (filePath in library.analyzedFiles) {
    video = await getVideoById(library.analyzedFiles[filePath] ?? "");
  } else {
    video = await addVideoAsMovie(movie.id, {
      fileSrc: filePath,
      movieId: movie.id,
    });

    if (!video) return;

    library.analyzedFiles[filePath] = video.id;
  }

  // Save data in DB
  video?.save();

  // Add episode to view
  //Utils.addEpisode(wsManager, library.id, movie.id, video);
}
