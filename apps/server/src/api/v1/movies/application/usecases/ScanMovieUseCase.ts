import type { MovieResponse } from 'moviedb-promise';
import type { CollectionsRepositoryPort } from '@/api/v1/collections/application/ports/CollectionsRepositoryPort';
import type { Collection } from '@/api/v1/collections/domain/Collection';
import type { LibrariesRepositoryPort } from '@/api/v1/libraries/application/ports/LibrariesRepositoryPort';
import type { Library } from '@/api/v1/libraries/domain/Library';
import type { FileSystemServicePort } from '@/api/v1/shared/application/ports/FileSystemServicePort';
import type { MetadataProviderPort } from '@/api/v1/shared/application/ports/MetadataProviderPort';
import type { NotificationServicePort } from '@/api/v1/shared/application/ports/NotificationServicePort';
import { downloaderService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { getOnlyRuntime } from '@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo';
import { extractNameAndYear } from '@/api/v1/shared/infrastructure/services/FileSearchService';
import { WriteQueue } from '@/api/v1/shared/infrastructure/services/WriteQueue';
import type { VideoRepositoryPort } from '@/api/v1/videos/application/ports/VideosRepositoryPort';
import { type Video, VideoType } from '@/api/v1/videos/domain/Video';
import logger from '@/utils/logger';
import { getFileName } from '@/utils/utils';
import type { Movie } from '../../domain/Movie';
import type { MoviesRepositoryPort } from '../ports/MoviesRepositoryPort';

export class ScanMovieUseCase {
  private readonly writeQueue = new WriteQueue();

  constructor(
    private readonly filesManager: FileSystemServicePort,
    private readonly librariesRepo: LibrariesRepositoryPort,
    private readonly movieRepository: MoviesRepositoryPort,
    private readonly videoRepo: VideoRepositoryPort,
    private readonly collectionRepo: CollectionsRepositoryPort,
    private readonly metadataProvider: MetadataProviderPort,
    private readonly notificationService: NotificationServicePort,
  ) {}

  async execute(library: Library, root: string): Promise<void> {
    logger.info({ libraryId: library.id, root }, 'Starting movies scan execution');

    const isFolder = await this.filesManager.isFolder(root);

    // Edge case: Root is a direct file
    if (!isFolder) {
      if (this.filesManager.isVideoFile(root)) {
        // Single file: write directly through queue
        await this.writeQueue.enqueue(async () => {
          await this.processMovieFolder(library, root, [root], []);
        });

        // Update the library at the end of the global process
        await this.updateLibraryHelper(library);
      }

      logger.info({ libraryId: library.id, root }, 'Added single file as movie');

      return;
    }

    // Analyze folder structure
    const contents = await this.filesManager.getFilesInFolder(root);

    // Filter which ones are folders to decide if it's a Collection or a Movie
    const subFolders = await Promise.all(
      contents.map(async (f) => ({
        path: `${root}/${f.name}`,
        isDir: await this.filesManager.isFolder(`${root}/${f.name}`),
      })),
    );
    const validFolders = subFolders.filter((f) => f.isDir).map((f) => f.path);

    // Decision logic: Is it a movie collection or a single movie with folders?
    // We assume that if there are folders inside, it's a collection, UNLESS the folder is named "extras".
    const hasSubFolders = validFolders.length > 0;
    const isMovieFolder = !hasSubFolders || validFolders.every((f) => this.isExtrasFolder(f));

    if (isMovieFolder) {
      // Strategy: Single Movie
      await this.handleSingleMovieScan(library, root);

      logger.info({ libraryId: library.id, root }, 'Added single folder as movie');
    } else {
      // Strategy: Collection (Multiple movie folders)
      await this.handleCollectionScan(library, root, validFolders);

      logger.info({ libraryId: library.id, root }, 'Added multiple folders as collection');
    }

    // Update the library at the end of the global process
    await this.updateLibraryHelper(library);
  }

  //#region SCANNING STRATEGIES

  private async handleSingleMovieScan(library: Library, root: string): Promise<void> {
    const { mainFiles, extraFiles } = await this.detectMovieFiles(root);
    await this.writeQueue.enqueue(async () => {
      await this.processMovieFolder(library, root, mainFiles, extraFiles);
    });
  }

  private async handleCollectionScan(
    library: Library,
    root: string,
    folders: string[],
  ): Promise<void> {
    const collectionTitle = getFileName(root);

    // Create or retrieve collection
    const collection = await this.writeQueue.enqueue(async () => {
      let coll = await this.collectionRepo.getByName(collectionTitle);
      if (!coll) {
        coll = await this.collectionRepo.add({ title: collectionTitle });
      }
      if (coll) {
        await this.collectionRepo.addLibrary(library.id, coll.id);
      }
      return coll;
    });

    if (!collection) {
      logger.error({ root }, 'Failed to process collection');
      return;
    }

    this.notificationService.mutateLibrary(library.id);

    // Read: detect files concurrently (no DB writes)
    const detectionTasks = folders.map((folder) => this.detectMovieFiles(folder));
    const detectionResults = await Promise.all(detectionTasks);

    // Write: process movies sequentially through queue
    for (let i = 0; i < folders.length; i++) {
      const { mainFiles, extraFiles } = detectionResults[i];

      if (mainFiles.length > 0) {
        await this.writeQueue.enqueue(async () => {
          await this.processMovieFolder(library, folders[i], mainFiles, extraFiles, collection);
        });
      }
    }
  }

  //#endregion

  /**
   * Detects main and extra files based on the folder structure.
   */
  private async detectMovieFiles(
    root: string,
  ): Promise<{ mainFiles: string[]; extraFiles: string[] }> {
    const allFiles = await this.filesManager.getFilesInFolder(root);
    const mainFiles: string[] = [];
    const extraFiles: string[] = [];

    // Files in the root of the folder
    for (const file of allFiles) {
      const fullPath = `${root}/${file.name}`;
      if (await this.filesManager.isFolder(fullPath)) {
        // If it's an "extras" folder, scan inside
        if (this.isExtrasFolder(fullPath)) {
          const extrasInFolder = await this.filesManager.getValidVideoFiles(fullPath);
          extraFiles.push(...extrasInFolder);
        }
      } else {
        if (this.filesManager.isVideoFile(fullPath)) {
          mainFiles.push(fullPath);
        }
      }
    }
    return { mainFiles, extraFiles };
  }

  /**
   * Processes a single movie folder
   * @param library Library to add movie to
   * @param folderPath Path to folder
   * @param mainFiles Main video files
   * @param extraFiles Extra video files
   * @param collection Collection to add movie to (if any)
   * @returns
   */
  private async processMovieFolder(
    library: Library,
    folderPath: string,
    mainFiles: string[],
    extraFiles: string[],
    collection?: Collection,
  ) {
    // Get or create movie
    const movie = await this.getOrCreateMovie(library, folderPath);
    if (!movie) return;

    // Link to collection if it exists
    if (collection) {
      await this.collectionRepo.addMovie(collection.id, movie.id).catch((e) => logger.warn(e));
    }

    // Search Metadata (if not locked or if it's new)
    const nameAndYear = extractNameAndYear(getFileName(folderPath));

    const name = nameAndYear[0];
    const year = nameAndYear[1];

    const movieMetadata = await this.searchMovieMetadata(name, year, library.language);

    if (movieMetadata) {
      await this.metadataProvider
        .updateMovieMetadata(movie, movieMetadata, library.language, collection)
        .catch((err) => logger.error({ err, movieId: movie.id }, 'Failed update metadata'));
    } else {
      // Fallback: use filename
      if (!movie.name) {
        // Only if it doesn't already have a name
        movie.name = name;
        movie.year = year !== '1' ? year : '';
        await this.movieRepository.update(movie.id, movie);
      }
    }

    // Partial notification for UI
    this.notificationService.mutateMovie(movie);

    // Download main theme in parallel
    downloaderService.autoDownloadFirstAudioResult(`${movie.name} main theme`, movie.id);

    // Process videos sequentially (already in queue)
    const allFiles = [...mainFiles, ...extraFiles];
    const types = [
      ...mainFiles.map(() => VideoType.MAIN),
      ...extraFiles.map(() => VideoType.EXTRA),
    ];

    for (let i = 0; i < allFiles.length; i++) {
      await this.ensureVideoAndProcess(library, movie, allFiles[i], types[i], !!movieMetadata);
    }

    // Update movie in DB
    await this.movieRepository.update(movie.id, movie);

    // Mutate content on clients
    this.notificationService.mutateMovie(movie);
  }

  /**
   * Handles the creation, identification (hash), and updating of videos.
   */
  private async ensureVideoAndProcess(
    library: Library,
    movie: Movie,
    filePath: string,
    type: VideoType,
    hasMetadata: boolean,
  ) {
    try {
      let video: Video | null = null;
      if (filePath in library.analyzedFiles) {
        const videoId = library.analyzedFiles[filePath];
        video = await this.videoRepo.findById(videoId);
      }

      if (video) {
        // The video exists. Check if it has been moved.
        if (video.fileSrc !== filePath) {
          logger.info({ oldPath: video.fileSrc, newPath: filePath }, 'Video moved, updating path');
          video.fileSrc = filePath;
          await this.videoRepo.update(video.id, { fileSrc: filePath });
        }
        // Ensure it's linked to this movie (rare case of reassignment)
        if (video.movieId !== movie.id) {
          video.movieId = movie.id;
          await this.videoRepo.update(video.id, { movieId: movie.id });
        }
      } else {
        // New Video
        if (type === VideoType.MAIN) {
          video = await this.videoRepo.addAsMovie(movie.id, {
            fileSrc: filePath,
          });
        } else {
          video = await this.videoRepo.addAsMovieExtra(movie.id, {
            fileSrc: filePath,
          });
        }
      }

      if (!video) {
        logger.error({ filePath, movieId: movie.id }, 'Failed to create/retrieve video');
        return;
      }

      // Register in the library as analyzed (Cache path -> ID)
      await this.registerAnalyzedVideo(library, filePath, video.id);

      // Technical Analysis (FFmpeg) - Only if data is missing
      await this.ensureRuntime(video, filePath);

      // E. External Metadata (Usually only for Main features, or if extras are supported)
      await this.updateVideoMetadata(video, movie, hasMetadata, type);

      // Update video in DB
      await this.videoRepo.update(video.id, video);
    } catch (error) {
      logger.error({ error, filePath, movieId: movie.id }, 'Error processing video file');
    }
  }

  private async registerAnalyzedVideo(
    library: Library,
    filePath: string,
    videoId: string,
  ): Promise<void> {
    library.analyzedFiles = {
      ...library.analyzedFiles,
      [filePath]: videoId,
    };

    await this.librariesRepo.addAnalyzedFile(library.id, filePath, videoId);
  }

  private async ensureRuntime(video: Video, filePath: string): Promise<void> {
    if (video.runtime && video.runtime > 0) return;

    try {
      video.runtime = await getOnlyRuntime(filePath);
      await this.videoRepo.update(video.id, { runtime: video.runtime });
    } catch (_e) {
      logger.warn({ filePath }, 'Failed to extract runtime');
    }
  }

  private async updateVideoMetadata(
    video: Video,
    movie: Movie,
    hasMetadata: boolean,
    type: VideoType,
  ): Promise<void> {
    if (hasMetadata && type === VideoType.MAIN) {
      try {
        await this.metadataProvider.updateVideoMetadataForMovie(video, movie);
      } catch (error) {
        logger.warn(
          { error, videoId: video.id, movieId: movie.id },
          'Failed to update video metadata',
        );
      }
      return;
    }

    if (!video.imgSrc) {
      video.imgSrc = 'resources/img/Default_video_thumbnail.jpg';
      await this.videoRepo.update(video.id, { imgSrc: video.imgSrc });
    }
  }

  //#region HELPERS

  /**
   * Gets existing movie or creates a new one
   * @param library Library to add movie to
   * @param folderPath Path to folder
   * @returns Movie or null
   */
  private async getOrCreateMovie(library: Library, folderPath: string): Promise<Movie | null> {
    // Check for library cache
    if (folderPath in library.analyzedFolders) {
      const cachedId = library.analyzedFolders[folderPath];
      if (cachedId) return await this.movieRepository.findById(cachedId);
    }

    // Create new movie
    const movie = await this.movieRepository.create({
      libraryId: library.id,
      folder: folderPath,
    });

    if (movie) {
      library.analyzedFolders = {
        ...library.analyzedFolders,
        [folderPath]: movie.id,
      };

      await this.librariesRepo.addAnalyzedFolder(library.id, folderPath, movie.id);
    }
    return movie;
  }

  /**
   * Search TMDB for movie metadata
   * @param name Movie title
   * @param year Release date
   * @param lang Language
   * @returns Movie metadata or null
   */
  private async searchMovieMetadata(
    name: string,
    year: string,
    lang: string,
  ): Promise<MovieResponse | null> {
    try {
      const results = await this.metadataProvider.searchMovies(name, year);
      if (!results || results.length === 0) return null;
      const firstResultId = results[0]?.id;
      if (!firstResultId) return null;
      return await this.metadataProvider.getMovie(firstResultId, lang);
    } catch (_e) {
      logger.warn({ name, year }, 'TMDB Search failed');
      return null;
    }
  }

  /**
   * Check if the given path is an extras folder
   * @param path Path to check
   * @returns true or false
   */
  private isExtrasFolder(path: string): boolean {
    const name = getFileName(path).toLowerCase();
    return name === 'extras' || name === 'extra' || name === 'specials' || name === 'trailers';
  }

  /**
   * Updates the library in the database
   * @param library The library to update
   * @param movie The movie id to track updates
   */
  async updateLibraryHelper(library: Library, movie?: Movie) {
    // Wrap in queue
    await this.writeQueue.enqueue(async () => {
      try {
        await this.librariesRepo.update(library.id, library);
      } catch (error) {
        logger.error(
          {
            libraryId: library.id,
            movieId: movie?.id,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to update library in database',
        );
      }
    });
  }

  //#endregion
}
