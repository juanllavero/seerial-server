import {
  addCollection,
  addLibraryToCollection,
  addMovieToCollection,
} from "@/api/v0/collections/collections.service";
import { Collection, Library, Movie, Video } from "@/api/v0/index.models";
import { addMovie, getMovieById } from "@/api/v0/movies/movies.service";
import {
  addVideoAsMovie,
  getVideoById,
  getVideoByMovieId,
} from "@/api/v0/videos/videos.service";
import { getOnlyRuntime } from "@/ffmpeg/mediaInfo";
import { extractNameAndYear } from "@/file-search/utils/utils";
import { wsManager } from "@/index";
import { FilesManager } from "@/managers/FilesManager";
import { MetadataManager } from "@/managers/MetadataManager";
import { WebSocketManager } from "@/managers/WebSocketManager";
import { MovieDBWrapper } from "@/theMovieDB/MovieDB";
import { MovieResponse } from "moviedb-promise";

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
  if (!(await FilesManager.isFolder(root))) {
    // ONLY ONE FILE
    if (!FilesManager.isVideoFile(root)) return;

    await processFolder(library, root, [root]);
  } else {
    const filesInDir = await FilesManager.getFilesInFolder(root);
    const filesInRoot: string[] = [];
    const folders: string[] = [];

    for (const file of filesInDir) {
      const filePath = `${root}/${file.name}`;
      if (await FilesManager.isFolder(filePath)) {
        folders.push(filePath);
      } else {
        if (FilesManager.isVideoFile(filePath)) filesInRoot.push(filePath);
      }
    }

    if (folders.length > 0) {
      // FOLDERS CORRESPONDING DIFFERENT MOVIES FROM A COLLECTION

      // Add collection or retrieve existing one
      const collection = await addCollection({
        title: FilesManager.getFileName(root),
      });

      if (collection) {
        await addLibraryToCollection(library.id, collection.id);
      }

      // Update content in clients
      WebSocketManager.mutateLibrary(wsManager, library.id);

      const processPromises = folders.map(async (folder) => {
        const files = await FilesManager.getValidVideoFiles(folder);
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
  let movie: Movie | null = null;
  if (rootFolder in library.analyzedFolders) {
    movie = await getMovieById(library.analyzedFolders[rootFolder] ?? "");
  }

  let movieMetadata: MovieResponse | null | undefined = null;

  const fileFullName = FilesManager.getFileName(rootFolder);
  const nameAndYear = extractNameAndYear(fileFullName);

  let name = nameAndYear[0];
  let year = nameAndYear[1];

  movieMetadata = await searchMovie(name, year, library.language);

  if (!movie) {
    movie = await addMovie({
      libraryId: library.id,
      folder: rootFolder,
    });
  }

  if (!movie) return;

  await library.addAnalyzedFolder(rootFolder, movie.id);

  if (collection) {
    addMovieToCollection(collection.id, movie.id);
  }

  if (!movieMetadata) {
    //Save videos without metadata
    movie.name = name;
    movie.year = year !== "1" ? year : "";

    const processPromises = files.map(async (file) => {
      await saveMovieWithoutMetadata(library, movie, file, wsManager);
    });

    await Promise.all(processPromises);

    // Update content in clients
    WebSocketManager.mutateMovie(wsManager, movie);
    return;
  }

  await MetadataManager.updateMovieMetadata(
    movie,
    movieMetadata,
    library.language,
    collection
  );

  // Update content in clients
  WebSocketManager.mutateLibrary(wsManager, library.id);
  WebSocketManager.mutateMovie(wsManager, movie);

  const processPromises = files.map(async (file) => {
    await processVideo(library, movie, file, wsManager);
  });

  await Promise.all(processPromises);

  // Save data in DB
  library.save();

  // Update content in clients
  WebSocketManager.mutateLibrary(wsManager, library.id);
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
  let videos = await getVideoByMovieId(movie.id);

  let video: Video | null = null;
  if (!videos?.find((v) => v.fileSrc === filePath))
    video = await addVideoAsMovie(movie.id);

  if (!video) return;

  video.movieId = movie.id;
  video.runtime = await getOnlyRuntime(video.fileSrc);

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

  // Update content in clients
  WebSocketManager.mutateMovie(wsManager, movie);
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
  let video: Video | null = null;

  if (filePath in library.analyzedFiles) {
    video = await getVideoById(library.analyzedFiles[filePath] ?? "");
  } else {
    let videos = await getVideoByMovieId(movie.id);

    if (!videos?.find((v) => v.fileSrc === filePath)) {
      video = await addVideoAsMovie(movie.id, {
        fileSrc: filePath,
        movieId: movie.id,
      });
    }

    if (!video) return;

    await library.addAnalyzedFile(filePath, video.id);
  }

  if (!video) return;

  video.runtime = await getOnlyRuntime(video.fileSrc);

  await MetadataManager.updateVideoMetadataForMovie(video, movie);

  // Update content in clients
  WebSocketManager.mutateMovie(wsManager, movie);
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
  let video: Video | null = null;

  if (filePath in library.analyzedFiles) {
    video = await getVideoById(library.analyzedFiles[filePath] ?? "");
  } else {
    let videos = await getVideoByMovieId(movie.id);

    if (!videos?.find((v) => v.fileSrc === filePath)) {
      video = await addVideoAsMovie(movie.id, {
        fileSrc: filePath,
        movieId: movie.id,
      });
    }

    if (!video) return;

    library.analyzedFiles[filePath] = video.id;
  }

  if (!video) return;

  video.runtime = await getOnlyRuntime(video.fileSrc);

  // Save data in DB
  video.save();

  // Update content in clients
  WebSocketManager.mutateMovie(wsManager, movie);
}
