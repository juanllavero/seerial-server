import { CollectionsRepositoryPort } from "@/api/v1/collections/application/ports/CollectionRepositoryPort";
import { Collection } from "@/api/v1/collections/domain/Collection";
import { LibrariesRepositoryPort } from "@/api/v1/libraries/application/ports/LibrariesRepositoryPort";
import { Library } from "@/api/v1/libraries/domain/Library";
import { FileSystemServicePort } from "@/api/v1/shared/application/ports/FileSystemServicePort";
import { MetadataProviderPort } from "@/api/v1/shared/application/ports/MetadataProviderPort";
import {
  notificationService,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import { getOnlyRuntime } from "@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo";
import { VideoRepositoryPort } from "@/api/v1/videos/application/ports/VideosRepositoryPort";
import { Video } from "@/api/v1/videos/domain/Video";
import { extractNameAndYear } from "@/file-search/utils/utils";
import logger from "@/utils/logger";
import { getFileName } from "@/utils/utils";
import { MovieResponse } from "moviedb-promise";
import { Movie } from "../../domain/Movie";
import { MoviesRepositoryPort } from "../ports/MoviesRepositoryPort";

export class ScanMovieUseCase {
  constructor(
    private readonly filesManager: FileSystemServicePort,
    private readonly librariesRepo: LibrariesRepositoryPort,
    private readonly movieRepository: MoviesRepositoryPort,
    private readonly videoRepo: VideoRepositoryPort,
    private readonly collectionRepo: CollectionsRepositoryPort,
    private readonly metadataProvider: MetadataProviderPort
  ) {}

  async execute(library: Library, root: string): Promise<void> {
    logger.info(
      {
        libraryId: library.id,
        rootFolder: root,
      },
      "Starting movie scan execution"
    );

    if (!(await this.filesManager.isFolder(root))) {
      // ONLY ONE FILE
      logger.info(
        {
          libraryId: library.id,
          rootFile: root,
        },
        "Processing single movie file"
      );

      if (!this.filesManager.isVideoFile(root)) {
        logger.warn(
          {
            libraryId: library.id,
            rootFile: root,
          },
          "Single file is not a valid video file, skipping"
        );
        return;
      }

      await this.processFolder(library, root, [root]);
    } else {
      logger.info(
        {
          libraryId: library.id,
          rootFolder: root,
        },
        "Processing movie folder, analyzing contents"
      );

      const filesInDir = await this.filesManager.getFilesInFolder(root);
      const filesInRoot: string[] = [];
      const folders: string[] = [];

      for (const file of filesInDir) {
        const filePath = `${root}/${file.name}`;
        if (await this.filesManager.isFolder(filePath)) {
          folders.push(filePath);
        } else {
          if (this.filesManager.isVideoFile(filePath))
            filesInRoot.push(filePath);
        }
      }

      logger.info(
        {
          libraryId: library.id,
          rootFolder: root,
          foldersFound: folders.length,
          filesFound: filesInRoot.length,
        },
        "Analyzed folder contents"
      );

      if (folders.length > 0) {
        // FOLDERS CORRESPONDING DIFFERENT MOVIES FROM A COLLECTION
        logger.info(
          {
            libraryId: library.id,
            rootFolder: root,
            foldersCount: folders.length,
          },
          "Detected multiple movie folders, creating collection"
        );

        // Add collection or retrieve existing one
        const collectionTitle = getFileName(root);
        logger.debug(
          {
            libraryId: library.id,
            collectionTitle,
          },
          "Creating or retrieving collection"
        );

        const collection = await this.collectionRepo.add({
          title: collectionTitle,
        });

        if (collection) {
          logger.info(
            {
              libraryId: library.id,
              collectionId: collection.id,
              collectionTitle: collection.title,
            },
            "Successfully created/retrieved collection"
          );

          await this.collectionRepo.addLibrary(library.id, collection.id);
          logger.debug(
            {
              libraryId: library.id,
              collectionId: collection.id,
            },
            "Added library to collection"
          );
        } else {
          logger.error(
            {
              libraryId: library.id,
              collectionTitle,
            },
            "Failed to create or retrieve collection"
          );
        }

        // Update content in clients
        notificationService.mutateLibrary(library.id);

        logger.info(
          {
            libraryId: library.id,
            foldersCount: folders.length,
          },
          "Processing movie folders in collection"
        );

        const processPromises = folders.map(async (folder) => {
          logger.debug(
            {
              libraryId: library.id,
              folder,
              collectionId: collection?.id,
            },
            "Processing movie folder"
          );

          const files = await this.filesManager.getValidVideoFiles(folder);
          await this.processFolder(
            library,
            folder,
            files,
            collection ?? undefined
          );
        });

        try {
          await Promise.all(processPromises);
          logger.info(
            {
              libraryId: library.id,
              foldersProcessed: folders.length,
            },
            "Successfully processed all movie folders in collection"
          );
        } catch (error) {
          logger.error(
            {
              libraryId: library.id,
              error: error instanceof Error ? error.message : String(error),
            },
            "Failed to process some movie folders in collection"
          );
        }
      } else {
        // MOVIE FILE/CONCERT FILES INSIDE FOLDER
        logger.info(
          {
            libraryId: library.id,
            rootFolder: root,
            filesCount: filesInRoot.length,
          },
          "Processing single movie folder"
        );

        await this.processFolder(library, root, filesInRoot);
      }
    }

    // Update Library
    try {
      this.librariesRepo.update(library.id, library);
      logger.info(
        {
          libraryId: library.id,
        },
        "Successfully updated library after movie scan"
      );
    } catch (error) {
      logger.error(
        {
          libraryId: library.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to update library after movie scan"
      );
    }
  }

  /**
   * Processes the files inside the movie folder, creating the Movie object and searching for metadata
   * @param rootFolder Root folder of the movie
   * @param files Video files inside the root folder
   * @param collection Collection from the movie
   */
  async processFolder(
    library: Library,
    rootFolder: string,
    files: string[],
    collection?: Collection
  ) {
    logger.info(
      {
        libraryId: library.id,
        rootFolder,
        filesCount: files.length,
        hasCollection: !!collection,
        collectionId: collection?.id,
      },
      "Starting to process movie folder"
    );

    let movie: Movie | null = null;
    if (rootFolder in library.analyzedFolders) {
      logger.info(
        {
          libraryId: library.id,
          rootFolder,
          movieId: library.analyzedFolders[rootFolder],
        },
        "Folder already analyzed, retrieving existing movie"
      );

      movie = await this.movieRepository.findById(
        library.analyzedFolders[rootFolder] ?? ""
      );

      if (!movie) {
        logger.error(
          {
            libraryId: library.id,
            rootFolder,
            expectedMovieId: library.analyzedFolders[rootFolder],
          },
          "Failed to find existing movie that should exist"
        );
      }
    }

    let movieMetadata: MovieResponse | null | undefined = null;

    const fileFullName = getFileName(rootFolder);
    const nameAndYear = extractNameAndYear(fileFullName);

    let name = nameAndYear[0];
    let year = nameAndYear[1];

    logger.debug(
      {
        libraryId: library.id,
        rootFolder,
        extractedName: name,
        extractedYear: year,
        fullFileName: fileFullName,
      },
      "Extracted movie name and year from folder path"
    );

    movieMetadata = await this.searchMovie(name, year, library.language);

    if (!movie) {
      logger.info(
        {
          libraryId: library.id,
          rootFolder,
        },
        "Creating new movie entry"
      );

      movie = await this.movieRepository.create({
        libraryId: library.id,
        folder: rootFolder,
      });

      if (!movie) {
        logger.error(
          {
            libraryId: library.id,
            rootFolder,
          },
          "Failed to create movie entry"
        );
        return;
      }

      logger.info(
        {
          libraryId: library.id,
          rootFolder,
          movieId: movie.id,
        },
        "Successfully created new movie entry"
      );
    }

    try {
      await useCases
        .addAnalyzedFolder()
        .execute(library.id, rootFolder, movie.id);

      logger.debug(
        {
          libraryId: library.id,
          rootFolder,
          movieId: movie.id,
        },
        "Added folder to analyzed folders"
      );
    } catch (error) {
      logger.error(
        {
          libraryId: library.id,
          rootFolder,
          movieId: movie.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to add folder to analyzed folders"
      );
    }

    if (collection) {
      try {
        this.collectionRepo.addMovie(collection.id, movie.id);
        logger.debug(
          {
            libraryId: library.id,
            movieId: movie.id,
            collectionId: collection.id,
          },
          "Added movie to collection"
        );
      } catch (error) {
        logger.error(
          {
            libraryId: library.id,
            movieId: movie.id,
            collectionId: collection.id,
            error: error instanceof Error ? error.message : String(error),
          },
          "Failed to add movie to collection"
        );
      }
    }

    if (!movieMetadata) {
      logger.warn(
        {
          libraryId: library.id,
          movieId: movie.id,
          rootFolder,
          searchName: name,
          searchYear: year,
        },
        "No movie metadata found in TMDb, processing without metadata"
      );

      //Save videos without metadata
      movie.name = name;
      movie.year = year !== "1" ? year : "";

      logger.info(
        {
          libraryId: library.id,
          movieId: movie.id,
          filesCount: files.length,
        },
        "Processing video files without movie metadata"
      );

      const processPromises = files.map(async (file) => {
        logger.debug(
          {
            libraryId: library.id,
            movieId: movie.id,
            filePath: file,
          },
          "Processing video file without metadata"
        );

        await this.saveMovieWithoutMetadata(library, movie, file);
      });

      try {
        await Promise.all(processPromises);
        logger.info(
          {
            libraryId: library.id,
            movieId: movie.id,
            filesProcessed: files.length,
          },
          "Successfully processed all video files without metadata"
        );
      } catch (error) {
        logger.error(
          {
            libraryId: library.id,
            movieId: movie.id,
            error: error instanceof Error ? error.message : String(error),
          },
          "Failed to process some video files without metadata"
        );
      }

      // Update content in clients
      notificationService.mutateMovie(movie);
      return;
    }

    logger.info(
      {
        libraryId: library.id,
        movieId: movie.id,
        tmdbId: movieMetadata.id,
        movieTitle: movieMetadata.title,
      },
      "Found movie metadata, updating movie information"
    );

    try {
      await this.metadataProvider.updateMovieMetadata(
        movie,
        movieMetadata,
        library.language,
        collection
      );

      logger.info(
        {
          libraryId: library.id,
          movieId: movie.id,
        },
        "Successfully updated movie metadata"
      );
    } catch (error) {
      logger.error(
        {
          libraryId: library.id,
          movieId: movie.id,
          tmdbId: movieMetadata.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to update movie metadata"
      );
      // Continue anyway
    }

    // Update content in clients
    notificationService.mutateLibrary(library.id);
    notificationService.mutateMovie(movie);

    logger.info(
      {
        libraryId: library.id,
        movieId: movie.id,
        filesCount: files.length,
      },
      "Processing video files with movie metadata"
    );

    const processPromises = files.map(async (file) => {
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath: file,
        },
        "Processing video file with metadata"
      );

      await this.processVideo(library, movie, file);
    });

    try {
      await Promise.all(processPromises);
      logger.info(
        {
          libraryId: library.id,
          movieId: movie.id,
          filesProcessed: files.length,
        },
        "Successfully processed all video files with metadata"
      );
    } catch (error) {
      logger.error(
        {
          libraryId: library.id,
          movieId: movie.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to process some video files with metadata"
      );
    }

    // Save data in DB
    try {
      useCases.updateLibrary().execute(library.id, library);
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
        },
        "Updated library in database"
      );
    } catch (error) {
      logger.error(
        {
          libraryId: library.id,
          movieId: movie.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to update library in database"
      );
    }

    // Update content in clients
    notificationService.mutateLibrary(library.id);
  }

  /**
   * Searches in TheMovieDB for a specific movie name and year and returns the first match
   * @param name Title of the movie
   * @param year Release year of the movie
   * @returns The first result of the search
   */
  async searchMovie(name: string, year: string, language: string) {
    logger.debug(
      {
        searchName: name,
        searchYear: year,
        language,
      },
      "Searching for movie in TMDb"
    );

    try {
      const moviesSearch = await this.metadataProvider.searchMovies(name, year);

      if (!moviesSearch || moviesSearch.length === 0) {
        logger.warn(
          {
            searchName: name,
            searchYear: year,
            language,
          },
          "No movies found in TMDb search"
        );
        return undefined;
      }

      logger.debug(
        {
          searchName: name,
          searchYear: year,
          resultsCount: moviesSearch.length,
          firstResultId: moviesSearch[0].id,
          firstResultTitle: moviesSearch[0].title,
        },
        "Found movies in TMDb search, retrieving detailed movie data"
      );

      const movieData = await this.metadataProvider.getMovie(
        moviesSearch[0].id ?? 0,
        language
      );

      if (movieData) {
        logger.info(
          {
            searchName: name,
            searchYear: year,
            movieId: movieData.id,
            movieTitle: movieData.title,
            releaseDate: movieData.release_date,
          },
          "Successfully retrieved movie metadata from TMDb"
        );
      } else {
        logger.warn(
          {
            searchName: name,
            searchYear: year,
            expectedMovieId: moviesSearch[0].id,
          },
          "Failed to retrieve detailed movie data from TMDb"
        );
      }

      return movieData;
    } catch (error) {
      logger.error(
        {
          searchName: name,
          searchYear: year,
          language,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to search for movie in TMDb"
      );
      return undefined;
    }
  }

  /**
   * Processes the video file associated to a movie without any metadata from TheMovieDB
   * @param movie Movie object
   * @param filePath Path to the video file
   */
  async saveMovieWithoutMetadata(
    library: Library,
    movie: Movie,
    filePath: string
  ) {
    logger.debug(
      {
        libraryId: library.id,
        movieId: movie.id,
        filePath,
      },
      "Starting to save movie video without metadata"
    );

    let videos = await this.videoRepo.findByMovieId(movie.id);

    let video: Video | null = null;
    if (!videos?.find((v) => v.fileSrc === filePath)) {
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
        },
        "Video entry does not exist, creating new video entry"
      );

      video = await this.videoRepo.addAsMovie(movie.id);

      if (!video) {
        logger.error(
          {
            libraryId: library.id,
            movieId: movie.id,
            filePath,
          },
          "Failed to create video entry for movie"
        );
        return;
      }

      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
        },
        "Successfully created video entry"
      );
    }

    if (!video) {
      logger.warn(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
        },
        "Video entry already exists, skipping video entry creation"
      );
      return;
    }

    video.movieId = movie.id;

    try {
      video.runtime = await getOnlyRuntime(video.fileSrc);
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
          runtime: video.runtime,
        },
        "Successfully retrieved video runtime"
      );
    } catch (error) {
      logger.warn(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to get video runtime, continuing without runtime"
      );
    }

    if (filePath in library.analyzedFiles) {
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          existingVideoId: library.analyzedFiles[filePath],
        },
        "File already analyzed, retrieving existing video entry"
      );

      video = await this.videoRepo.findById(
        library.analyzedFiles[filePath] ?? ""
      );

      if (!video) {
        logger.error(
          {
            libraryId: library.id,
            movieId: movie.id,
            filePath,
            expectedVideoId: library.analyzedFiles[filePath],
          },
          "Failed to find existing video entry that should exist"
        );
        return;
      }
    }

    if (!video) return;

    try {
      await useCases.addAnalyzedFile().execute(library.id, filePath, video.id);
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
        },
        "Added file to analyzed files"
      );
    } catch (error) {
      logger.error(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to add file to analyzed files"
      );
    }

    video.fileSrc = filePath;
    video.imgSrc = "resources/img/Default_video_thumbnail.jpg";

    // Save data in DB
    try {
      useCases.updateMovie().execute(movie.id, movie);
      useCases.updateVideo().execute(video.id, video);

      logger.info(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
        },
        "Successfully saved movie and video data to database"
      );
    } catch (error) {
      logger.error(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to save movie and video data to database"
      );
    }

    // Update content in clients
    notificationService.mutateMovie(movie);
    logger.debug(
      {
        libraryId: library.id,
        movieId: movie.id,
      },
      "Sent movie mutation notification to clients"
    );
  }

  /**
   * Processes the video file associated to a movie
   * @param movie Movie object
   * @param filePath Path to the video file
   */
  async processVideo(library: Library, movie: Movie, filePath: string) {
    logger.debug(
      {
        libraryId: library.id,
        movieId: movie.id,
        filePath,
      },
      "Starting to process movie video file"
    );

    let video: Video | null = null;

    if (filePath in library.analyzedFiles) {
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          existingVideoId: library.analyzedFiles[filePath],
        },
        "File already analyzed, retrieving existing video entry"
      );

      video = await this.videoRepo.findById(
        library.analyzedFiles[filePath] ?? ""
      );

      if (!video) {
        logger.error(
          {
            libraryId: library.id,
            movieId: movie.id,
            filePath,
            expectedVideoId: library.analyzedFiles[filePath],
          },
          "Failed to find existing video entry that should exist"
        );
        return;
      }
    } else {
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
        },
        "File not analyzed, checking for existing video entry by movie and file"
      );

      let videos = await this.videoRepo.findByMovieId(movie.id);

      if (!videos?.find((v) => v.fileSrc === filePath)) {
        logger.debug(
          {
            libraryId: library.id,
            movieId: movie.id,
            filePath,
          },
          "Video entry does not exist, creating new video entry"
        );

        video = await this.videoRepo.addAsMovie(movie.id, {
          fileSrc: filePath,
          movieId: movie.id,
        });

        if (!video) {
          logger.error(
            {
              libraryId: library.id,
              movieId: movie.id,
              filePath,
            },
            "Failed to create video entry for movie"
          );
          return;
        }

        logger.debug(
          {
            libraryId: library.id,
            movieId: movie.id,
            filePath,
            videoId: video.id,
          },
          "Successfully created video entry"
        );

        try {
          await useCases
            .addAnalyzedFile()
            .execute(library.id, filePath, video.id);
          logger.debug(
            {
              libraryId: library.id,
              movieId: movie.id,
              filePath,
              videoId: video.id,
            },
            "Added file to analyzed files"
          );
        } catch (error) {
          logger.error(
            {
              libraryId: library.id,
              movieId: movie.id,
              filePath,
              videoId: video.id,
              error: error instanceof Error ? error.message : String(error),
            },
            "Failed to add file to analyzed files"
          );
        }
      }
    }

    if (!video) {
      logger.error(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
        },
        "No video entry available for processing"
      );
      return;
    }

    try {
      video.runtime = await getOnlyRuntime(video.fileSrc);
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
          runtime: video.runtime,
        },
        "Successfully retrieved video runtime"
      );
    } catch (error) {
      logger.warn(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to get video runtime, continuing without runtime"
      );
    }

    try {
      await this.metadataProvider.updateVideoMetadataForMovie(video, movie);
      logger.info(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
        },
        "Successfully updated video metadata for movie"
      );
    } catch (error) {
      logger.error(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to update video metadata for movie"
      );
    }

    // Update content in clients
    notificationService.mutateMovie(movie);
    logger.debug(
      {
        libraryId: library.id,
        movieId: movie.id,
      },
      "Sent movie mutation notification to clients"
    );
  }

  /**
   * Processes the video file associated to a movie extra
   * @param movie Movie object
   * @param filePath Path to the video file
   */
  async processVideoAsExtra(library: Library, movie: Movie, filePath: string) {
    logger.debug(
      {
        libraryId: library.id,
        movieId: movie.id,
        filePath,
      },
      "Starting to process movie extra video file"
    );

    let video: Video | null = null;

    if (filePath in library.analyzedFiles) {
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          existingVideoId: library.analyzedFiles[filePath],
        },
        "File already analyzed, retrieving existing video entry for extra"
      );

      video = await this.videoRepo.findById(
        library.analyzedFiles[filePath] ?? ""
      );

      if (!video) {
        logger.error(
          {
            libraryId: library.id,
            movieId: movie.id,
            filePath,
            expectedVideoId: library.analyzedFiles[filePath],
          },
          "Failed to find existing video entry for extra that should exist"
        );
        return;
      }
    } else {
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
        },
        "File not analyzed, checking for existing video entry for extra"
      );

      let videos = await this.videoRepo.findByMovieId(movie.id);

      if (!videos?.find((v) => v.fileSrc === filePath)) {
        logger.debug(
          {
            libraryId: library.id,
            movieId: movie.id,
            filePath,
          },
          "Video entry for extra does not exist, creating new video entry"
        );

        video = await this.videoRepo.addAsMovie(movie.id, {
          fileSrc: filePath,
          movieId: movie.id,
        });

        if (!video) {
          logger.error(
            {
              libraryId: library.id,
              movieId: movie.id,
              filePath,
            },
            "Failed to create video entry for movie extra"
          );
          return;
        }

        logger.debug(
          {
            libraryId: library.id,
            movieId: movie.id,
            filePath,
            videoId: video.id,
          },
          "Successfully created video entry for extra"
        );

        library.analyzedFiles[filePath] = video.id;
        logger.debug(
          {
            libraryId: library.id,
            movieId: movie.id,
            filePath,
            videoId: video.id,
          },
          "Added extra file to analyzed files"
        );
      } else {
        // Video already exists, get it from the search
        video = videos.find((v) => v.fileSrc === filePath) || null;
        if (!video) {
          logger.error(
            {
              libraryId: library.id,
              movieId: movie.id,
              filePath,
            },
            "Failed to find existing video entry for extra"
          );
          return;
        }
      }
    }

    if (!video) {
      logger.error(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
        },
        "No video entry available for processing extra"
      );
      return;
    }

    try {
      video.runtime = await getOnlyRuntime(video.fileSrc);
      logger.debug(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
          runtime: video.runtime,
        },
        "Successfully retrieved video runtime for extra"
      );
    } catch (error) {
      logger.warn(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to get video runtime for extra, continuing without runtime"
      );
    }

    // Save data in DB
    try {
      useCases.updateVideo().execute(video.id, video);
      logger.info(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
        },
        "Successfully saved movie extra video data to database"
      );
    } catch (error) {
      logger.error(
        {
          libraryId: library.id,
          movieId: movie.id,
          filePath,
          videoId: video.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to save movie extra video data to database"
      );
    }

    // Update content in clients
    notificationService.mutateMovie(movie);
    logger.debug(
      {
        libraryId: library.id,
        movieId: movie.id,
      },
      "Sent movie mutation notification to clients for extra"
    );
  }
}
