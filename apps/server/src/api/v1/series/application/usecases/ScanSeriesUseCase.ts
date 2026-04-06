import path from 'node:path';
import type {
  Episode,
  EpisodeGroupResponse,
  Episode as MovieDBEpisode,
  TvSeasonResponse,
} from 'moviedb-promise';
import type { EpisodeRepositoryPort } from '@/api/v1/episodes/application/ports/EpisodeRepositoryPort';
import type { LibrariesRepositoryPort } from '@/api/v1/libraries/application/ports/LibrariesRepositoryPort';
import type { Library } from '@/api/v1/libraries/domain/Library';
import type { SeasonsRepositoryPort } from '@/api/v1/seasons/application/ports/SeasonsRepositoryPort';
import type { Season } from '@/api/v1/seasons/domain/Season';
import type { FileSystemServicePort } from '@/api/v1/shared/application/ports/FileSystemServicePort';
import type { MetadataProviderPort } from '@/api/v1/shared/application/ports/MetadataProviderPort';
import type { NotificationServicePort } from '@/api/v1/shared/application/ports/NotificationServicePort';
import { downloaderService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { WriteQueue } from '@/api/v1/shared/infrastructure/services/WriteQueue';
import type { VideoRepositoryPort } from '@/api/v1/videos/application/ports/VideosRepositoryPort';
import logger from '@/utils/logger';
import type { Episode as EpisodeLocal } from '../../../episodes/domain/Episode';
import type { Video } from '../../../videos/domain/Video';
import type { Series } from '../../domain/Series';
import type { SeriesRepositoryPort } from '../ports/SeriesRepositoryPort';

interface EpisodeResolution {
  videoSrc: string;
  seasonMetadata: TvSeasonResponse | null;
  episodeMetadata: Episode | null;
  realSeason?: number;
  realEpisode?: number;
}

interface EpisodeBatchUpdate {
  episode: EpisodeLocal;
  video: Video;
  metadata: Episode;
}

export class ScanSeriesUseCase {
  private readonly writeQueue = new WriteQueue();

  constructor(
    private readonly filesManager: FileSystemServicePort,
    private readonly librariesRepo: LibrariesRepositoryPort,
    private readonly seriesRepo: SeriesRepositoryPort,
    private readonly seasonsRepo: SeasonsRepositoryPort,
    private readonly videoRepo: VideoRepositoryPort,
    private readonly episodesRepo: EpisodeRepositoryPort,
    private readonly metadataProvider: MetadataProviderPort,
    private readonly notificationService: NotificationServicePort,
  ) { }

  async execute(library: Library, root: string): Promise<void> {
    logger.info(
      {
        libraryId: library.id,
        root,
      },
      'Starting series scan execution',
    );

    if (!(await this.filesManager.isFolder(root))) {
      logger.warn(
        {
          libraryId: library.id,
          root,
        },
        'Root path is not a valid folder, skipping scan',
      );
      return;
    }

    // Check for valid video files inside folder
    const videoFiles = await this.filesManager.getValidVideoFiles(root);
    if (videoFiles.length === 0) {
      logger.warn(
        {
          libraryId: library.id,
          root,
        },
        'No valid video files found in folder, skipping scan',
      );
      return;
    }

    // Smart skip: check if any files changed
    if (!(await this.hasFilesChanged(library, videoFiles))) {
      logger.info(
        {
          libraryId: library.id,
          root,
          fileCount: videoFiles.length,
        },
        'All files already analyzed, skipping scan',
      );
      return;
    }

    // Get or create series (wrapped in queue)
    const show = await this.writeQueue.enqueue(async () => {
      return await this.getOrCreateSeries(library, root);
    });

    if (!show) {
      logger.error(
        {
          libraryId: library.id,
          root,
        },
        'Failed to get or create series',
      );
      return;
    }

    // Search and update metadata
    await this.ensureSeriesMetadata(library, show, root);

    // Download main theme in parallel
    downloaderService.autoDownloadFirstAudioResult(`${show.name} main theme`, show.id);

    // Update series analyzing status
    await this.writeQueue.enqueue(async () => {
      show.analyzingFiles = true;
      await this.seriesRepo.update(show.id, show);
    });

    this.notificationService.mutateSeries(show);

    // Broadcast scan started
    this.notificationService.broadcast(
      JSON.stringify({
        header: 'SERIES_SCAN_PROGRESS',
        body: {
          seriesId: show.id,
          status: 'started',
          processed: 0,
          total: videoFiles.length,
        },
      }),
    );

    // Download seasons metadata
    const showData = await this.metadataProvider.getTVShow(show.themdbId, library.language);

    if (!showData?.seasons) {
      logger.error(
        {
          seriesId: show.id,
          tmdbId: show.themdbId,
          showData: showData,
        },
        'TV show data has no seasons, cannot proceed',
      );
      return;
    }

    const showDataId = showData.id;
    if (!showDataId) {
      logger.error(
        {
          seriesId: show.id,
          tmdbId: show.themdbId,
        },
        'TV show data has no TMDb id, cannot proceed',
      );
      return;
    }

    const seasonPromises = showData.seasons
      .filter((seasonBasic) => seasonBasic.season_number != null)
      .map((seasonBasic) =>
        this.metadataProvider.getSeason(
          showDataId,
          seasonBasic.season_number as number,
          library.language,
        ),
      );

    const seasonsMetadata = (await Promise.all(seasonPromises)).filter(
      Boolean,
    ) as TvSeasonResponse[];

    if (seasonsMetadata.length === 0) {
      logger.error(
        {
          seriesId: show.id,
          tmdbId: show.themdbId,
          seasonsRequested: showData.seasons.length,
        },
        'No valid season metadata downloaded, cannot proceed',
      );
      return;
    }

    // Download episode groups metadata if needed
    let episodesGroup: EpisodeGroupResponse | undefined;
    if (show.episodeGroupId) {
      try {
        episodesGroup = await this.metadataProvider.getEpisodeGroup(show.episodeGroupId);
      } catch (error) {
        logger.error(
          {
            seriesId: show.id,
            episodeGroupId: show.episodeGroupId,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to download episode groups metadata',
        );
      }
    }

    // Process episodes
    await this.processEpisodes(library, videoFiles, show, seasonsMetadata, episodesGroup);

    // Check if series has valid seasons
    const seasons = await this.seasonsRepo.findSeasonsBySeriesId(show.id);
    if (!seasons || seasons.length < 1) {
      logger.error(
        {
          seriesId: show.id,
          seasonsFound: seasons?.length || 0,
        },
        'No valid seasons found after processing, deleting series',
      );
      await this.writeQueue.enqueue(async () => {
        await this.seriesRepo.delete(show.id);
      });
      return;
    }

    // Update series analyzing status
    await this.writeQueue.enqueue(async () => {
      show.analyzingFiles = false;
      await this.seriesRepo.update(show.id, show);
    });

    this.notificationService.mutateSeries(show);

    // Broadcast scan completed
    this.notificationService.broadcast(
      JSON.stringify({
        header: 'SERIES_SCAN_PROGRESS',
        body: {
          seriesId: show.id,
          status: 'completed',
          processed: videoFiles.length,
          total: videoFiles.length,
        },
      }),
    );
  }

  //#region SERIES MANAGEMENT

  /**
   * Gets existing series or creates a new one
   */
  private async getOrCreateSeries(library: Library, root: string): Promise<Series | null> {
    // Check for library cache
    if (root in library.analyzedFolders) {
      const show = await this.seriesRepo.findById(library.analyzedFolders[root] ?? '');
      if (show) return show;
    }

    // Create new series
    const show = await this.seriesRepo.create({
      folder: root,
      libraryId: library.id,
    });

    if (!show) return null;

    // Update library cache
    library.analyzedFolders = {
      ...library.analyzedFolders,
      [root]: show.id,
    };

    await this.librariesRepo.addAnalyzedFolder(library.id, root, show.id);

    return show;
  }

  /**
   * Ensures series has TMDb ID and metadata
   */
  private async ensureSeriesMetadata(library: Library, show: Series, root: string): Promise<void> {
    // Search for themdbId if not set
    if (show.themdbId === -1) {
      let finalName: string = root.split(/[/\\]/).pop() ?? '';
      const pattern = /^(.*?)(?:\s(\d{4}))?$/;
      let year: string | undefined = '1';
      const matcher = finalName.replace(/[()]/g, '').match(pattern);

      if (matcher) {
        finalName = matcher[1];
        year = matcher[2] ?? '1';
      }

      logger.info(
        {
          seriesId: show.id,
          extractedName: finalName,
          extractedYear: year,
        },
        'Extracted series name and year from folder path',
      );

      try {
        const showsSearch = await this.metadataProvider.searchTVShows(finalName, year);

        if (!showsSearch || showsSearch.length === 0) {
          logger.warn(
            {
              seriesId: show.id,
              searchName: finalName,
              searchYear: year,
            },
            'No TV shows found in TMDb search, cannot proceed with metadata',
          );
          return;
        }

        show.themdbId = showsSearch[0].id ?? -1;
      } catch (error) {
        logger.error(
          {
            seriesId: show.id,
            searchName: finalName,
            searchYear: year,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to search for series in TMDb',
        );
        return;
      }
    }

    // Update series metadata
    try {
      await this.metadataProvider.updateSeriesMetadata(show, library.language);
    } catch (error) {
      logger.error(
        {
          seriesId: show.id,
          tmdbId: show.themdbId,
          language: library.language,
          error: error instanceof Error ? error.message : String(error),
        },
        'Failed to update series metadata',
      );
    }
  }

  /**
   * Checks if any files have changed since last scan
   */
  private async hasFilesChanged(library: Library, videoFiles: string[]): Promise<boolean> {
    // If any file is not in analyzedFiles, we have changes
    const hasNewFiles = videoFiles.some((file) => !(file in library.analyzedFiles));

    if (hasNewFiles) return true;

    // Check if all analyzed files still exist
    const analyzedFilesForThisFolder = Object.keys(library.analyzedFiles);
    const missingFiles = analyzedFilesForThisFolder.filter((file) => !videoFiles.includes(file));

    return missingFiles.length > 0;
  }

  //#endregion

  //#region EPISODE PROCESSING

  /**
   * Processes all video files of a series to add the seasons and episodes
   */
  async processEpisodes(
    library: Library,
    videoFiles: string[],
    show: Series,
    seasonsMetadata: TvSeasonResponse[],
    episodesGroup: EpisodeGroupResponse | undefined,
  ) {
    const seasonsIndex = this.indexSeasons(seasonsMetadata);
    const cumulativeEpisodes = this.buildCumulativeEpisodes(seasonsMetadata);

    // Parallel episode detection
    const resolutionPromises = videoFiles.map((videoFile) =>
      this.resolveEpisodeMetadata(
        show,
        videoFile,
        seasonsMetadata,
        seasonsIndex,
        cumulativeEpisodes,
        episodesGroup,
      ).then((resolution) => ({ videoSrc: videoFile, ...resolution })),
    );

    const resolutions = await Promise.all(resolutionPromises);

    // Serial processing through queue with batch updates
    let processedFiles = 0;
    let skippedFiles = 0;
    const batchUpdates: EpisodeBatchUpdate[] = [];

    for (const resolution of resolutions) {
      const alreadyAnalyzed = library.analyzedFiles[resolution.videoSrc];
      const hasEpisode = alreadyAnalyzed
        ? await this.episodesRepo.findByVideoSrc(resolution.videoSrc)
        : null;

      if (alreadyAnalyzed && hasEpisode) {
        skippedFiles++;
        continue;
      }

      if (!resolution.seasonMetadata || !resolution.episodeMetadata) {
        logger.warn(
          {
            seriesId: show.id,
            videoSrc: resolution.videoSrc,
          },
          'Could not resolve season/episode metadata for file, skipping',
        );
        continue;
      }

      try {
        await this.writeQueue.enqueue(async () => {
          const result = await this.processEpisode(library, show, resolution);

          if (result) {
            batchUpdates.push(result);
          }
        });
        processedFiles++;

        // Progress reporting
        if (processedFiles % 5 === 0 || processedFiles === resolutions.length) {
          this.notificationService.broadcast(
            JSON.stringify({
              header: 'SERIES_SCAN_PROGRESS',
              body: {
                seriesId: show.id,
                status: 'processing',
                processed: processedFiles + skippedFiles,
                total: videoFiles.length,
              },
            }),
          );
        }
      } catch (error) {
        logger.error(
          {
            seriesId: show.id,
            videoFile: resolution.videoSrc,
            error: error instanceof Error ? error.message : String(error),
          },
          'Failed to process video file',
        );
      }
    }

    // Batch metadata updates
    if (batchUpdates.length > 0) {
      await this.batchUpdateEpisodeMetadata(show, batchUpdates);
    }

    // Post-processing: rename seasons
    await this.postProcessSeasons(show, episodesGroup);
  }

  /**
   * Processes a video file to add the season and episode
   * Returns episode data for batch update if successful
   */
  async processEpisode(
    library: Library,
    show: Series,
    resolution: EpisodeResolution,
  ): Promise<EpisodeBatchUpdate | null> {
    const { videoSrc, seasonMetadata, episodeMetadata, realSeason, realEpisode } = resolution;

    if (!seasonMetadata || !episodeMetadata) {
      logger.warn(
        {
          seriesId: show.id,
          videoSrc,
          realSeason,
          realEpisode,
        },
        'Could not resolve season/episode metadata for file, skipping',
      );
      return null;
    }

    // Ensure season exists
    const season = await this.ensureSeason(show, seasonMetadata, realSeason, realEpisode);
    if (!season) {
      logger.error(
        {
          seriesId: show.id,
          videoSrc,
          seasonNumber: seasonMetadata.season_number,
        },
        'Failed to ensure season exists in database',
      );
      return null;
    }

    // Ensure episode exists
    const episode = await this.ensureEpisode(
      season,
      episodeMetadata,
      realEpisode,
      library,
      videoSrc,
    );
    if (!episode) {
      logger.error(
        {
          seriesId: show.id,
          seasonId: season.id,
          videoSrc,
          episodeNumber: episodeMetadata.episode_number,
        },
        'Failed to ensure episode exists in database',
      );
      return null;
    }

    // Ensure video exists
    let video = await this.videoRepo.findByEpisodeId(episode.id);
    if (!video) {
      video = await this.videoRepo.addAsEpisode(episode.id, {
        fileSrc: videoSrc,
      });
      if (!video) {
        logger.error(
          {
            seriesId: show.id,
            episodeId: episode.id,
            videoSrc,
          },
          'Failed to create video entry for episode',
        );
        return null;
      }
    }

    this.notificationService.mutateSeason();

    // Return data for batch update
    return {
      episode,
      video,
      metadata: episodeMetadata,
    };
  }

  /**
   * Batch update episode metadata to reduce API calls
   */
  private async batchUpdateEpisodeMetadata(
    show: Series,
    updates: EpisodeBatchUpdate[],
  ): Promise<void> {
    // Process in chunks to avoid overwhelming the system
    const chunkSize = 10;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);

      const updatePromises = chunk.map(({ episode, video, metadata }) =>
        this.metadataProvider
          .updateEpisodeMetadata(episode, video, show, metadata)
          .catch((error) => {
            logger.error(
              {
                seriesId: show.id,
                episodeId: episode.id,
                videoId: video.id,
                error: error instanceof Error ? error.message : String(error),
              },
              'Failed to update episode metadata in batch',
            );
          }),
      );

      await Promise.all(updatePromises);
    }
  }

  /**
   * Post-processes seasons to rename based on episode groups or fix duplicates
   */
  private async postProcessSeasons(
    show: Series,
    episodesGroup: EpisodeGroupResponse | undefined,
  ): Promise<void> {
    const seasons = await this.seasonsRepo.findSeasonsBySeriesId(show.id);
    if (!seasons) {
      logger.error(
        {
          seriesId: show.id,
        },
        'Failed to retrieve seasons after processing',
      );
      return;
    }

    // Rename seasons based on episodes group
    if (show.episodeGroupId && episodesGroup?.groups) {
      for (const season of seasons) {
        const group = episodesGroup.groups.find((g) => g.order === season.seasonNumber);
        if (group?.name && season.name !== group.name) {
          season.name = group.name;
          await this.seasonsRepo.update(season.id, season);
        }
      }
    } else if (seasons.length > 1 && seasons[0].name === seasons[1].name) {
      // Apply default season numbering due to duplicate names
      for (const season of seasons) {
        if (season.seasonNumber !== 0) {
          const newName = `Season ${season.seasonNumber}`;
          if (season.name !== newName) {
            season.name = newName;
            await this.seasonsRepo.update(season.id, season);
          }
        }
      }
    }
  }

  //#endregion

  //#region SEASON & EPISODE DB HELPERS

  /**
   * Ensures a season exists in the database
   */
  async ensureSeason(
    show: Series,
    seasonMetadata: TvSeasonResponse,
    realSeason?: number,
    realEpisode?: number,
  ): Promise<Season | null> {
    const seasons = await this.seasonsRepo.findSeasonsBySeriesId(show.id);
    let season: Season | null =
      seasons?.find((s: Season) =>
        realEpisode !== -1 && realSeason
          ? s.seasonNumber === realSeason
          : s.seasonNumber === seasonMetadata.season_number,
      ) ?? null;

    if (season) return season;

    season = await this.seasonsRepo.create({
      seriesId: show.id,
      name: seasonMetadata.name ?? '',
      year: seasonMetadata.episodes?.[0]?.air_date ?? '',
      overview: seasonMetadata.overview ?? show.overview,
      seasonNumber: realEpisode !== -1 ? (realSeason ?? 0) : (seasonMetadata.season_number ?? 0),
    });

    if (!season) return null;

    // Update metadata
    await this.metadataProvider.updateSeasonMetadata(season, show);

    if (season.seasonNumber === 0) season.order = 100;
    await this.seasonsRepo.update(season.id, season);

    this.notificationService.mutateSeries(show);
    return season;
  }

  /**
   * Ensures an episode exists in the database
   */
  async ensureEpisode(
    season: Season,
    episodeMetadata: Episode,
    realEpisode: number | undefined,
    library: Library,
    videoSrc: string,
  ): Promise<EpisodeLocal | null> {
    const episodes = await this.episodesRepo.findAllBySeasonId(season.id);

    let episode: EpisodeLocal | null =
      episodes?.find((ep) =>
        realEpisode && realEpisode !== -1
          ? ep.episodeNumber === realEpisode
          : ep.episodeNumber === episodeMetadata.episode_number,
      ) ?? null;

    if (episode) return episode;

    // Create episode if not exists
    episode = await this.episodesRepo.create({
      seasonId: season.id,
      seasonNumber: season.seasonNumber,
      name: episodeMetadata.name ?? '',
      overview: episodeMetadata.overview ?? '',
      year: episodeMetadata.air_date ?? '',
      score: episodeMetadata.vote_average ? (episodeMetadata.vote_average * 10.0) / 10.0 : 0,
      episodeNumber:
        realEpisode && realEpisode !== -1 ? realEpisode : (episodeMetadata.episode_number ?? 0),
    });

    if (!episode) return null;

    // Update library cache
    library.analyzedFiles = {
      ...library.analyzedFiles,
      [videoSrc]: episode.id,
    };

    await this.librariesRepo.addAnalyzedFile(library.id, videoSrc, episode.id);

    return episode;
  }

  //#endregion

  //#region METADATA RESOLUTION

  /**
   * Resolves episode metadata from filename
   */
  async resolveEpisodeMetadata(
    show: Series,
    videoSrc: string,
    seasonsMetadata: TvSeasonResponse[],
    seasonsIndex: Map<number, { season: TvSeasonResponse; episodesMap: Map<number, Episode> }>,
    cumulativeEpisodes: number[],
    episodesGroup?: EpisodeGroupResponse,
  ): Promise<{
    seasonMetadata: TvSeasonResponse | null;
    episodeMetadata: Episode | null;
    realSeason?: number;
    realEpisode?: number;
  }> {
    let seasonMetadata: TvSeasonResponse | null = null;
    let episodeMetadata: Episode | null = null;
    let realSeason: number | undefined = 0;
    let realEpisode: number | undefined = -1;

    const fullName = path.parse(videoSrc).name;
    const seasonEpisode: [number, number?] = this.extractEpisodeSeason(fullName);

    if (Number.isNaN(seasonEpisode[0])) {
      return { seasonMetadata, episodeMetadata };
    }

    // Absolute number
    if (!seasonEpisode[1]) {
      const absoluteNumber = seasonEpisode[0];
      const result = this.getSeasonEpisodeByAbsoluteNumber(
        absoluteNumber,
        seasonsMetadata,
        cumulativeEpisodes,
      );

      if (!result) return { seasonMetadata, episodeMetadata };

      seasonMetadata = result.season;
      episodeMetadata = result.episode;
    } else {
      // Season + Episode
      const [episodeNumber, seasonNumber] = seasonEpisode;
      realSeason = seasonNumber;
      realEpisode = episodeNumber;

      const resolved = await this.resolveEpisodeBySeasonEpisode(
        show,
        episodeNumber,
        seasonNumber,
        seasonsMetadata,
        seasonsIndex,
        episodesGroup,
      );

      seasonMetadata = resolved?.seasonMetadata ?? null;
      episodeMetadata = resolved?.episodeMetadata ?? null;
    }

    return { seasonMetadata, episodeMetadata, realSeason, realEpisode };
  }

  /**
   * Resolves episode by season and episode number
   */
  async resolveEpisodeBySeasonEpisode(
    show: Series,
    episodeNumber: number,
    seasonNumber: number,
    seasonsMetadata: TvSeasonResponse[],
    seasonsIndex: Map<number, { season: TvSeasonResponse; episodesMap: Map<number, Episode> }>,
    episodesGroup?: EpisodeGroupResponse,
  ): Promise<{
    seasonMetadata?: TvSeasonResponse;
    episodeMetadata?: Episode;
  } | null> {
    const exists = seasonsMetadata.some((s) => s.season_number === seasonNumber);

    if (!exists && show.episodeGroupId) {
      const resolvedGroup =
        episodesGroup ?? (await this.metadataProvider.getEpisodeGroup(show.episodeGroupId));
      if (!resolvedGroup) return null;
      return this.findEpisodeInGroup(resolvedGroup, seasonNumber, episodeNumber, seasonsMetadata);
    }

    return this.findEpisodeInSeasonIndex(seasonsIndex, seasonNumber, episodeNumber);
  }

  private findEpisodeInGroup(
    episodesGroup: EpisodeGroupResponse,
    seasonNumber: number,
    episodeNumber: number,
    seasonsMetadata: TvSeasonResponse[],
  ): { seasonMetadata?: TvSeasonResponse; episodeMetadata?: Episode } | null {
    if (!episodesGroup?.groups) return null;

    for (const group of episodesGroup.groups) {
      if (group.order !== seasonNumber || !group.episodes) continue;
      const ep = group.episodes.find((e) => e.order && e.order + 1 === episodeNumber);
      if (!ep) continue;

      const seasonMeta = seasonsMetadata.find((s) => s.season_number === ep.season_number);
      const episodeMeta = seasonMeta?.episodes?.find((e) => e.episode_number === ep.episode_number);

      if (seasonMeta && episodeMeta) {
        return { seasonMetadata: seasonMeta, episodeMetadata: episodeMeta };
      }
    }

    return null;
  }

  private findEpisodeInSeasonIndex(
    seasonsIndex: Map<number, { season: TvSeasonResponse; episodesMap: Map<number, Episode> }>,
    seasonNumber: number,
    episodeNumber: number,
  ): { seasonMetadata?: TvSeasonResponse; episodeMetadata?: Episode } | null {
    const seasonData = seasonsIndex.get(seasonNumber);
    const episodeMetadata = seasonData?.episodesMap.get(episodeNumber);

    if (!seasonData || !episodeMetadata) return null;

    return {
      seasonMetadata: seasonData.season,
      episodeMetadata,
    };
  }

  /**
   * Get season and episode by absolute number
   */
  getSeasonEpisodeByAbsoluteNumber(
    absoluteNumber: number,
    seasonsMetadata: TvSeasonResponse[],
    cumulative: number[],
  ): { season: TvSeasonResponse; episode: MovieDBEpisode } | null {
    for (let i = 0; i < cumulative.length; i++) {
      if (absoluteNumber <= cumulative[i]) {
        const season = seasonsMetadata[i];
        const previousCount = i > 0 ? cumulative[i - 1] : 0;
        const episodeIndex = absoluteNumber - previousCount - 1; // Index from 0
        if (season.episodes?.[episodeIndex]) {
          return { season, episode: season.episodes[episodeIndex] };
        }
      }
    }
    return null;
  }

  /**
   * Extracts episode and season numbers from filename
   * @param filename path to the video file
   * @returns array of 1 to 2 elements corresponding with the episode and season number detected, or NaN if no episode was found
   */
  extractEpisodeSeason(filename: string): [number, number?] {
    const regexPatterns = [
      /[Ss](\d{1,4})[Ee](\d{1,4})(?:v\d+)?/i, // S01E02, s1e2, S1.E2, S01E01v2
      /[Ss](\d{1,4})[.]?E(\d{1,4})(?:v\d+)?/i, // S1.E2, S1.E2v1
      /[Ss](\d{1,4})[\s-]+Ep?(\d{1,4})(?:v\d+)?/i, // S01 E02, S1 E2
      /-\s?(\d{1,4})(?:v\d+)?(?!p)/, // - 01, - 01v1 (anime style)
      /(?:\b|^)(\d{1,4})(?:[^\d]+(\d{1,4}))?/i, // General case
    ];

    for (const regex of regexPatterns) {
      const match = filename.match(regex);
      if (match) {
        let episode: number;
        let season: number | undefined;
        if (regex === regexPatterns[3] && match[2]) {
          // Only consider the second number as the episode if two numbers are present
          episode = parseInt(match[2], 10);
          season = undefined;
        } else {
          episode = parseInt(match[2] ?? match[1], 10);
          season = match[2] ? parseInt(match[1], 10) : undefined;
        }
        return season ? [episode, season] : [episode];
      }
    }

    return [NaN];
  }

  //#endregion

  //#region INDEXING HELPERS

  /**
   * Function to index seasons by season number and episode number for faster access
   * @param seasonsMetadata Metadata of seasons
   * @returns Index of seasons by season number and episode number
   */
  indexSeasons(
    seasonsMetadata: TvSeasonResponse[],
  ): Map<number, { season: TvSeasonResponse; episodesMap: Map<number, MovieDBEpisode> }> {
    const index = new Map<
      number,
      { season: TvSeasonResponse; episodesMap: Map<number, MovieDBEpisode> }
    >();

    for (const season of seasonsMetadata) {
      if (season.season_number != null) {
        const episodesMap = new Map<number, MovieDBEpisode>();
        if (season.episodes) {
          for (const episode of season.episodes) {
            if (episode.episode_number != null) {
              episodesMap.set(episode.episode_number, episode);
            }
          }
        }
        index.set(season.season_number, { season, episodesMap });
      }
    }
    return index;
  }

  /**
   * Function to calculate the cumulative number of episodes in each season
   * @param seasonsMetadata Metadata of seasons
   * @returns Cumulative number of episodes in each season
   */
  buildCumulativeEpisodes(seasonsMetadata: TvSeasonResponse[]): number[] {
    const cumulative: number[] = [];
    let total = 0;

    for (const season of seasonsMetadata) {
      if (season.season_number != null && season.season_number >= 1 && season.episodes) {
        total += season.episodes.length;
        cumulative.push(total);
      }
    }
    return cumulative;
  }

  //#endregion
}
