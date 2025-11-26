import { CollectionsRepositoryPort } from "@/api/v0/collections/application/ports/CollectionRepositoryPort";
import { Collection } from "@/api/v0/collections/domain/Collection";
import { LibrariesRepositoryPort } from "@/api/v0/libraries/application/ports/LibrariesRepositoryPort";
import { Library } from "@/api/v0/libraries/domain/Library";
import { FileSystemServicePort } from "@/api/v0/shared/application/ports/FileSystemServicePort";
import { MetadataProviderPort } from "@/api/v0/shared/application/ports/MetadataProviderPort";
import {
  notificationService,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { VideoRepositoryPort } from "@/api/v0/videos/application/ports/VideosRepositoryPort";
import { Video } from "@/api/v0/videos/domain/Video";
import { getOnlyRuntime } from "@/ffmpeg/mediaInfo";
import { extractNameAndYear } from "@/file-search/utils/utils";
import { MetadataManager } from "@/managers/MetadataManager";
import { getFileName } from "@/utils/utils";
import { MovieResponse } from "moviedb-promise";
import { Movie } from "../../domain/Movie";
import { MoviesRepositoryPort } from "../ports/MoviesRepositoryPort";

export class ScanMovieUseCase {
  private readonly processMovieFolderUseCase = useCases.processMovieFolder();
  private readonly updateLibrary = useCases.updateLibrary();
  private readonly updateCollection = useCases.updateCollection();
  private readonly updateMovie = useCases.updateMovie();
  private readonly updateVideo = useCases.updateVideo();
  private readonly addAnalyzedFile = useCases.addAnalyzedFile();
  private readonly addAnalyzedFolder = useCases.addAnalyzedFolder();

  constructor(
    private readonly filesManager: FileSystemServicePort,
    private readonly librariesRepo: LibrariesRepositoryPort,
    private readonly movieRepository: MoviesRepositoryPort,
    private readonly videoRepo: VideoRepositoryPort,
    private readonly collectionRepo: CollectionsRepositoryPort,
    private readonly metadataProvider: MetadataProviderPort
  ) {}

  async execute(library: Library, root: string): Promise<void> {
    if (!(await this.filesManager.isFolder(root))) {
      // ONLY ONE FILE
      if (!this.filesManager.isVideoFile(root)) return;

      await this.processFolder(library, root, [root]);
    } else {
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

      if (folders.length > 0) {
        // FOLDERS CORRESPONDING DIFFERENT MOVIES FROM A COLLECTION

        // Add collection or retrieve existing one
        const collection = await this.collectionRepo.add({
          title: getFileName(root),
        });

        if (collection) {
          await this.collectionRepo.addLibrary(library.id, collection.id);
        }

        // Update content in clients
        notificationService.mutateLibrary(library.id);

        const processPromises = folders.map(async (folder) => {
          const files = await this.filesManager.getValidVideoFiles(folder);
          await this.processFolder(
            library,
            folder,
            files,
            collection ?? undefined
          );
        });

        await Promise.all(processPromises);
      } else {
        // MOVIE FILE/CONCERT FILES INSIDE FOLDER
        await this.processFolder(library, root, filesInRoot);
      }
    }

    // Update Library
    this.librariesRepo.update(library.id, library);
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
    let movie: Movie | null = null;
    if (rootFolder in library.analyzedFolders) {
      movie = await this.movieRepository.findById(
        library.analyzedFolders[rootFolder] ?? ""
      );
    }

    let movieMetadata: MovieResponse | null | undefined = null;

    const fileFullName = getFileName(rootFolder);
    const nameAndYear = extractNameAndYear(fileFullName);

    let name = nameAndYear[0];
    let year = nameAndYear[1];

    movieMetadata = await this.searchMovie(name, year, library.language);

    if (!movie) {
      movie = await this.movieRepository.create({
        libraryId: library.id,
        folder: rootFolder,
      });
    }

    if (!movie) return;

    await this.addAnalyzedFolder.execute(library.id, rootFolder, movie.id);

    if (collection) {
      this.collectionRepo.addMovie(collection.id, movie.id);
    }

    if (!movieMetadata) {
      //Save videos without metadata
      movie.name = name;
      movie.year = year !== "1" ? year : "";

      const processPromises = files.map(async (file) => {
        await this.saveMovieWithoutMetadata(library, movie, file);
      });

      await Promise.all(processPromises);

      // Update content in clients
      notificationService.mutateMovie(movie);
      return;
    }

    await MetadataManager.updateMovieMetadata(
      movie,
      movieMetadata,
      library.language,
      collection
    );

    // Update content in clients
    notificationService.mutateLibrary(library.id);
    notificationService.mutateMovie(movie);

    const processPromises = files.map(async (file) => {
      await this.processVideo(library, movie, file);
    });

    await Promise.all(processPromises);

    // Save data in DB
    this.updateLibrary.execute(library.id, library);

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
    const moviesSearch = await this.metadataProvider.searchMovies(name, year);

    return moviesSearch && moviesSearch.length > 0
      ? await this.metadataProvider.getMovie(moviesSearch[0].id ?? 0, language)
      : undefined;
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
    let videos = await this.videoRepo.findByMovieId(movie.id);

    let video: Video | null = null;
    if (!videos?.find((v) => v.fileSrc === filePath))
      video = await this.videoRepo.addAsMovie(movie.id);

    if (!video) return;

    video.movieId = movie.id;
    video.runtime = await getOnlyRuntime(video.fileSrc);

    if (filePath in library.analyzedFiles) {
      video = await this.videoRepo.findById(
        library.analyzedFiles[filePath] ?? ""
      );
    }

    if (!video) return;

    await this.addAnalyzedFile.execute(library.id, filePath, video.id);

    video.fileSrc = filePath;
    video.imgSrc = "resources/img/Default_video_thumbnail.jpg";

    // Save data in DB
    this.updateMovie.execute(movie.id, movie);
    this.updateVideo.execute(video.id, video);

    // Update content in clients
    notificationService.mutateMovie(movie);
  }

  /**
   * Processes the video file associated to a movie
   * @param movie Movie object
   * @param filePath Path to the video file
   */
  async processVideo(library: Library, movie: Movie, filePath: string) {
    let video: Video | null = null;

    if (filePath in library.analyzedFiles) {
      video = await this.videoRepo.findById(
        library.analyzedFiles[filePath] ?? ""
      );
    } else {
      let videos = await this.videoRepo.findByMovieId(movie.id);

      if (!videos?.find((v) => v.fileSrc === filePath)) {
        video = await this.videoRepo.addAsMovie(movie.id, {
          fileSrc: filePath,
          movieId: movie.id,
        });
      }

      if (!video) return;

      await this.addAnalyzedFile.execute(library.id, filePath, video.id);
    }

    if (!video) return;

    video.runtime = await getOnlyRuntime(video.fileSrc);

    await MetadataManager.updateVideoMetadataForMovie(video, movie);

    // Update content in clients
    notificationService.mutateMovie(movie);
  }

  /**
   * Processes the video file associated to a movie extra
   * @param movie Movie object
   * @param filePath Path to the video file
   */
  async processVideoAsExtra(library: Library, movie: Movie, filePath: string) {
    let video: Video | null = null;

    if (filePath in library.analyzedFiles) {
      video = await this.videoRepo.findById(
        library.analyzedFiles[filePath] ?? ""
      );
    } else {
      let videos = await this.videoRepo.findByMovieId(movie.id);

      if (!videos?.find((v) => v.fileSrc === filePath)) {
        video = await this.videoRepo.addAsMovie(movie.id, {
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
    this.updateVideo.execute(video.id, video);

    // Update content in clients
    notificationService.mutateMovie(movie);
  }
}
