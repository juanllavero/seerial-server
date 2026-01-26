import { Library } from "@/api/v1/libraries/domain/Library";
import { Season } from "@/api/v1/seasons/domain/Season";
import { FileSystemServicePort } from "@/api/v1/shared/application/ports/FileSystemServicePort";
import { MetadataProviderPort } from "@/api/v1/shared/application/ports/MetadataProviderPort";
import {
  notificationService,
  useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import logger from "@/utils/logger";
import {
  Episode,
  EpisodeGroupResponse,
  Episode as MovieDBEpisode,
  TvSeasonResponse,
} from "moviedb-promise";
import path from "path";
import { Episode as EpisodeLocal } from "../../../episodes/domain/Episode";
import { Series } from "../../domain/Series";

export class ScanSeriesUseCase {
  constructor(
    private readonly fileSystemService: FileSystemServicePort,
    private readonly metadataProvider: MetadataProviderPort
  ) {}

  async execute(library: Library, root: string): Promise<void> {
    logger.info(
      {
        libraryId: library.id,
        rootFolder: root,
      },
      "Starting series scan execution"
    );

    if (!(await this.fileSystemService.isFolder(root))) {
      logger.warn(
        {
          libraryId: library.id,
          rootFolder: root,
        },
        "Root folder is not a valid folder, skipping scan"
      );
      return;
    }

    const videoFiles = await this.fileSystemService.getValidVideoFiles(root);
    if (videoFiles.length === 0) {
      logger.info(
        {
          libraryId: library.id,
          rootFolder: root,
        },
        "No valid video files found in folder, skipping scan"
      );
      return;
    }

    logger.info(
      {
        libraryId: library.id,
        rootFolder: root,
        videoFilesCount: videoFiles.length,
      },
      "Retrieved valid video files from folder"
    );

    let show: Series | null = null;
    let exists: boolean = false;

    if (root in library.analyzedFolders) {
      logger.info(
        {
          libraryId: library.id,
          rootFolder: root,
          seriesId: library.analyzedFolders[root],
        },
        "Folder already analyzed, retrieving existing series"
      );
      show = await useCases
        .getSeriesById()
        .execute(library.analyzedFolders[root] ?? "");
      if (show !== null) exists = true;
    }

    if (show === null) {
      logger.info(
        {
          libraryId: library.id,
          rootFolder: root,
        },
        "Creating new series for folder"
      );
      show = await useCases.createSeries().execute({
        folder: root,
        libraryId: library.id,
      });
      if (!show) {
        logger.error(
          {
            libraryId: library.id,
            rootFolder: root,
          },
          "Failed to create series"
        );
        return;
      }
      await useCases.addAnalyzedFolder().execute(library.id, root, show.id);
      logger.info(
        {
          libraryId: library.id,
          rootFolder: root,
          seriesId: show.id,
        },
        "Successfully created and linked new series"
      );
    } else {
      logger.info(
        {
          libraryId: library.id,
          rootFolder: root,
          seriesId: show.id,
          seriesName: show.name,
        },
        "Successfully retrieved existing series"
      );
    }

    // Search for themdbId
    if (show.themdbId === -1) {
      logger.info(
        {
          seriesId: show.id,
          seriesName: show.name,
        },
        "Series has no TMDb ID, searching for metadata"
      );

      let finalName: string = root.split(/[/\\]/).pop() ?? "";
      const pattern = /^(.*?)(?:\s(\d{4}))?$/;
      let year: string | undefined = "1";
      const matcher = finalName.replace(/[()]/g, "").match(pattern);

      if (matcher) {
        finalName = matcher[1];
        year = matcher[2] ?? "1";
      }

      logger.debug(
        {
          seriesId: show.id,
          extractedName: finalName,
          extractedYear: year,
        },
        "Extracted series name and year from folder path"
      );

      try {
        const showsSearch = await this.metadataProvider.searchTVShows(
          finalName,
          year
        );

        if (!showsSearch || showsSearch.length === 0) {
          logger.error(
            {
              seriesId: show.id,
              searchName: finalName,
              searchYear: year,
            },
            "No TV shows found in TMDb search, cannot proceed with metadata"
          );
          return;
        }

        show.themdbId = showsSearch[0].id ?? -1;
        logger.info(
          {
            seriesId: show.id,
            tmdbId: show.themdbId,
            searchResultsCount: showsSearch.length,
            selectedTitle: showsSearch[0].name,
          },
          "Successfully found TMDb ID for series"
        );
      } catch (error) {
        logger.error(
          {
            seriesId: show.id,
            searchName: finalName,
            searchYear: year,
            error: error instanceof Error ? error.message : String(error),
          },
          "Failed to search for series in TMDb"
        );
        return;
      }
    } else {
      logger.info(
        {
          seriesId: show.id,
          tmdbId: show.themdbId,
        },
        "Series already has TMDb ID, skipping search"
      );
    }

    // Update series metadata
    logger.info(
      {
        seriesId: show.id,
        tmdbId: show.themdbId,
        language: library.language,
      },
      "Updating series metadata from TMDb"
    );

    try {
      await this.metadataProvider.updateSeriesMetadata(show, library.language);
      logger.info(
        {
          seriesId: show.id,
        },
        "Successfully updated series metadata"
      );
    } catch (error) {
      logger.error(
        {
          seriesId: show.id,
          tmdbId: show.themdbId,
          language: library.language,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to update series metadata"
      );
      // Continue anyway, as this might not be critical
    }

    show.analyzingFiles = true;
    try {
      await useCases.updateSeries().execute(show.id, show);
      logger.info(
        {
          seriesId: show.id,
        },
        "Set series analyzing status to true"
      );
    } catch (error) {
      logger.error(
        {
          seriesId: show.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to update series analyzing status"
      );
      return;
    }

    notificationService.mutateSeries(show);
    logger.debug(
      {
        seriesId: show.id,
      },
      "Sent series mutation notification to clients"
    );

    // Download seasons metadata
    logger.info(
      {
        seriesId: show.id,
        tmdbId: show.themdbId,
        language: library.language,
      },
      "Downloading TV show data from TMDb"
    );

    let showData;
    try {
      showData = await this.metadataProvider.getTVShow(
        show.themdbId,
        library.language
      );
    } catch (error) {
      logger.error(
        {
          seriesId: show.id,
          tmdbId: show.themdbId,
          language: library.language,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to download TV show data from TMDb"
      );
      return;
    }

    if (!showData?.seasons) {
      logger.error(
        {
          seriesId: show.id,
          tmdbId: show.themdbId,
          showData: showData,
        },
        "TV show data has no seasons, cannot proceed"
      );
      return;
    }

    logger.info(
      {
        seriesId: show.id,
        seasonsCount: showData.seasons.length,
      },
      "Found seasons in TV show data, downloading season metadata"
    );

    const seasonPromises = showData.seasons.map((seasonBasic) =>
      this.metadataProvider.getSeason(
        showData.id!,
        seasonBasic.season_number!,
        library.language
      )
    );

    let seasonsMetadata: TvSeasonResponse[];
    try {
      seasonsMetadata = (await Promise.all(seasonPromises)).filter(
        Boolean
      ) as TvSeasonResponse[];
    } catch (error) {
      logger.error(
        {
          seriesId: show.id,
          tmdbId: show.themdbId,
          seasonsRequested: showData.seasons.length,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to download season metadata from TMDb"
      );
      return;
    }

    if (seasonsMetadata.length === 0) {
      logger.error(
        {
          seriesId: show.id,
          tmdbId: show.themdbId,
          seasonsRequested: showData.seasons.length,
        },
        "No valid season metadata downloaded, cannot proceed"
      );
      return;
    }

    logger.info(
      {
        seriesId: show.id,
        seasonsDownloaded: seasonsMetadata.length,
        seasonsRequested: showData.seasons.length,
      },
      "Successfully downloaded season metadata"
    );

    // Download episode groups metadata if needed
    let episodesGroup: EpisodeGroupResponse | undefined;
    if (show.episodeGroupId) {
      logger.info(
        {
          seriesId: show.id,
          episodeGroupId: show.episodeGroupId,
        },
        "Downloading episode groups metadata"
      );

      try {
        episodesGroup = await this.metadataProvider.getEpisodeGroup(
          show.episodeGroupId
        );
        logger.info(
          {
            seriesId: show.id,
            episodeGroupId: show.episodeGroupId,
            groupsCount: episodesGroup?.groups?.length || 0,
          },
          "Successfully downloaded episode groups metadata"
        );
      } catch (error) {
        logger.error(
          {
            seriesId: show.id,
            episodeGroupId: show.episodeGroupId,
            error: error instanceof Error ? error.message : String(error),
          },
          "Failed to download episode groups metadata"
        );
        // Continue without episode groups
      }
    } else {
      logger.debug(
        {
          seriesId: show.id,
        },
        "No episode group ID, skipping episode groups download"
      );
    }

    logger.info(
      {
        seriesId: show.id,
        videoFilesCount: videoFiles.length,
        seasonsCount: seasonsMetadata.length,
        hasEpisodeGroups: !!episodesGroup,
      },
      "Starting episode processing for all video files"
    );

    await this.processEpisodes(
      library,
      videoFiles,
      show,
      seasonsMetadata,
      episodesGroup
    );

    logger.info(
      {
        seriesId: show.id,
      },
      "Completed episode processing, checking for valid seasons"
    );

    const seasons = await useCases.getSeasons().execute(show.id);
    if (!seasons || seasons.length < 1) {
      logger.error(
        {
          seriesId: show.id,
          seasonsFound: seasons?.length || 0,
        },
        "No valid seasons found after processing, deleting series"
      );
      try {
        await useCases.deleteSeries().execute(show.id);
        logger.info(
          {
            seriesId: show.id,
          },
          "Successfully deleted series with no valid seasons"
        );
      } catch (error) {
        logger.error(
          {
            seriesId: show.id,
            error: error instanceof Error ? error.message : String(error),
          },
          "Failed to delete series with no valid seasons"
        );
      }
      return;
    }

    logger.info(
      {
        seriesId: show.id,
        seasonsCount: seasons.length,
      },
      "Series has valid seasons, completing scan"
    );

    show.analyzingFiles = false;
    try {
      await useCases.updateSeries().execute(show.id, show);
      logger.info(
        {
          seriesId: show.id,
        },
        "Set series analyzing status to false"
      );
    } catch (error) {
      logger.error(
        {
          seriesId: show.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to update series analyzing status to false"
      );
      return;
    }

    notificationService.mutateSeries(show);
    logger.debug(
      {
        seriesId: show.id,
      },
      "Sent final series mutation notification to clients"
    );
  }

  // Process each video file
  async processEpisodes(
    library: Library,
    videoFiles: string[],
    show: Series,
    seasonsMetadata: TvSeasonResponse[],
    episodesGroup: EpisodeGroupResponse | undefined
  ) {
    logger.debug(
      {
        seriesId: show.id,
        videoFilesCount: videoFiles.length,
      },
      "Indexing seasons and building cumulative episodes data"
    );

    const seasonsIndex = this.indexSeasons(seasonsMetadata);
    const cumulativeEpisodes = this.buildCumulativeEpisodes(seasonsMetadata);

    logger.info(
      {
        seriesId: show.id,
        seasonsIndexed: seasonsIndex.size,
        cumulativeEpisodesTotal:
          cumulativeEpisodes[cumulativeEpisodes.length - 1] || 0,
      },
      "Successfully indexed seasons and built cumulative episodes"
    );

    let processedFiles = 0;
    let skippedFiles = 0;

    for (const videoFile of videoFiles) {
      const alreadyAnalyzed = library.analyzedFiles[videoFile];
      const hasEpisode = alreadyAnalyzed
        ? await useCases.getEpisodeByPath().execute(videoFile)
        : null;

      if (alreadyAnalyzed && hasEpisode) {
        logger.debug(
          {
            seriesId: show.id,
            videoFile,
            episodeId: hasEpisode.id,
          },
          "Skipping already analyzed file"
        );
        skippedFiles++;
        continue;
      }

      logger.info(
        {
          seriesId: show.id,
          videoFile,
          alreadyAnalyzed,
          hasEpisode: !!hasEpisode,
        },
        "Processing video file for episode data"
      );

      try {
        await this.processEpisode(
          library,
          show,
          videoFile,
          seasonsMetadata,
          seasonsIndex,
          cumulativeEpisodes,
          episodesGroup
        );
        processedFiles++;
      } catch (error) {
        logger.error(
          {
            seriesId: show.id,
            videoFile,
            error: error instanceof Error ? error.message : String(error),
          },
          "Failed to process video file"
        );
      }
    }

    logger.info(
      {
        seriesId: show.id,
        totalFiles: videoFiles.length,
        processedFiles,
        skippedFiles,
      },
      "Completed processing all video files"
    );

    const seasons = await useCases.getSeasons().execute(show.id);
    if (!seasons) {
      logger.error(
        {
          seriesId: show.id,
        },
        "Failed to retrieve seasons after processing"
      );
      return;
    }

    logger.info(
      {
        seriesId: show.id,
        seasonsCount: seasons.length,
        hasEpisodeGroups: !!episodesGroup,
      },
      "Renaming seasons based on episode groups or default naming"
    );

    // Rename seasons after episodes group
    if (show.episodeGroupId && episodesGroup?.groups) {
      logger.debug(
        {
          seriesId: show.id,
          episodeGroupId: show.episodeGroupId,
        },
        "Applying episode group names to seasons"
      );

      for (const season of seasons) {
        const group = episodesGroup.groups.find(
          (g) => g.order === season.seasonNumber
        );
        if (group) {
          const oldName = season.name;
          season.name = group.name ?? season.name;
          if (oldName !== season.name) {
            await useCases.updateSeason().execute(season.id, season);
            logger.debug(
              {
                seriesId: show.id,
                seasonId: season.id,
                seasonNumber: season.seasonNumber,
                oldName,
                newName: season.name,
              },
              "Updated season name from episode group"
            );
          }
        }
      }
    } else if (seasons.length > 1 && seasons[0].name === seasons[1].name) {
      logger.debug(
        {
          seriesId: show.id,
        },
        "Applying default season numbering due to duplicate names"
      );

      for (const season of seasons) {
        if (season.seasonNumber !== 0) {
          const oldName = season.name;
          season.name = `Season ${season.seasonNumber}`;
          if (oldName !== season.name) {
            await useCases.updateSeason().execute(season.id, season);
            logger.debug(
              {
                seriesId: show.id,
                seasonId: season.id,
                seasonNumber: season.seasonNumber,
                oldName,
                newName: season.name,
              },
              "Updated season name to default numbering"
            );
          }
        }
      }
    } else {
      logger.debug(
        {
          seriesId: show.id,
        },
        "No season renaming needed"
      );
    }
  }

  // Process a single video file
  async processEpisode(
    library: Library,
    show: Series,
    videoSrc: string,
    seasonsMetadata: TvSeasonResponse[],
    seasonsIndex: Map<
      number,
      { season: TvSeasonResponse; episodesMap: Map<number, Episode> }
    >,
    cumulativeEpisodes: number[],
    episodesGroup: EpisodeGroupResponse | undefined
  ) {
    logger.debug(
      {
        seriesId: show.id,
        videoSrc,
      },
      "Resolving episode metadata from filename"
    );

    const { seasonMetadata, episodeMetadata, realSeason, realEpisode } =
      await this.resolveEpisodeMetadata(
        show,
        videoSrc,
        seasonsMetadata,
        seasonsIndex,
        cumulativeEpisodes,
        episodesGroup
      );

    if (!seasonMetadata || !episodeMetadata) {
      logger.warn(
        {
          seriesId: show.id,
          videoSrc,
          realSeason,
          realEpisode,
        },
        "Could not resolve season/episode metadata for file, skipping"
      );
      return;
    }

    logger.info(
      {
        seriesId: show.id,
        videoSrc,
        seasonNumber: seasonMetadata.season_number,
        episodeNumber: episodeMetadata.episode_number,
        realSeason,
        realEpisode,
      },
      "Successfully resolved episode metadata"
    );

    // Ensure season in DB
    const season = await this.ensureSeason(
      show,
      seasonMetadata,
      realSeason,
      realEpisode
    );
    if (!season) {
      logger.error(
        {
          seriesId: show.id,
          videoSrc,
          seasonNumber: seasonMetadata.season_number,
        },
        "Failed to ensure season exists in database"
      );
      return;
    }

    // Ensure episode in DB
    let episode = await this.ensureEpisode(
      season,
      episodeMetadata,
      realSeason,
      realEpisode,
      library,
      videoSrc
    );
    if (!episode) {
      logger.error(
        {
          seriesId: show.id,
          seasonId: season.id,
          videoSrc,
          episodeNumber: episodeMetadata.episode_number,
        },
        "Failed to ensure episode exists in database"
      );
      return;
    }

    logger.info(
      {
        seriesId: show.id,
        seasonId: season.id,
        episodeId: episode.id,
        videoSrc,
      },
      "Successfully ensured season and episode exist in database"
    );

    // Ensure video in DB
    let video = await useCases.getVideoByEpisodeId().execute(episode.id);
    if (!video) {
      logger.info(
        {
          seriesId: show.id,
          episodeId: episode.id,
          videoSrc,
        },
        "Video not found for episode, creating video entry"
      );

      video = await useCases.addVideoAsEpisode().execute(episode.id, {
        fileSrc: videoSrc,
      });
      if (!video) {
        logger.error(
          {
            seriesId: show.id,
            episodeId: episode.id,
            videoSrc,
          },
          "Failed to create video entry for episode"
        );
        return;
      }

      logger.info(
        {
          seriesId: show.id,
          episodeId: episode.id,
          videoId: video.id,
          videoSrc,
        },
        "Successfully created video entry for episode"
      );
    } else {
      logger.debug(
        {
          seriesId: show.id,
          episodeId: episode.id,
          videoId: video.id,
          videoSrc,
        },
        "Video already exists for episode"
      );
    }

    // Update episode metadata
    logger.info(
      {
        seriesId: show.id,
        episodeId: episode.id,
        videoId: video.id,
        tmdbEpisodeId: episodeMetadata.id,
      },
      "Updating episode metadata from TMDb"
    );

    try {
      await this.metadataProvider.updateEpisodeMetadata(
        episode,
        video,
        show,
        episodeMetadata
      );

      logger.info(
        {
          seriesId: show.id,
          episodeId: episode.id,
          videoId: video.id,
        },
        "Successfully updated episode metadata"
      );
    } catch (error) {
      logger.error(
        {
          seriesId: show.id,
          episodeId: episode.id,
          videoId: video.id,
          tmdbEpisodeId: episodeMetadata.id,
          error: error instanceof Error ? error.message : String(error),
        },
        "Failed to update episode metadata"
      );
      // Continue anyway
    }

    // Notify changes in clients
    notificationService.mutateSeason();
    logger.debug(
      {
        seriesId: show.id,
        seasonId: season.id,
      },
      "Sent season mutation notification to clients"
    );
  }

  async ensureSeason(
    show: Series,
    seasonMetadata: TvSeasonResponse,
    realSeason?: number,
    realEpisode?: number
  ): Promise<Season | null> {
    const seasons = await useCases.getSeasons().execute(show.id);
    let season: Season | null =
      seasons?.find((s: Season) =>
        realEpisode !== -1 && realSeason
          ? s.seasonNumber === realSeason
          : s.seasonNumber === seasonMetadata.season_number
      ) ?? null;

    if (season) return season;

    season = await useCases.createSeason().execute({
      seriesId: show.id,
      name: seasonMetadata.name ?? "",
      year: seasonMetadata.episodes?.[0]?.air_date ?? "",
      overview: seasonMetadata.overview ?? show.overview,
      seasonNumber:
        realEpisode !== -1
          ? realSeason ?? 0
          : seasonMetadata.season_number ?? 0,
    });

    if (!season) return null;

    // Update metadata
    await this.metadataProvider.updateSeasonMetadata(season, show);

    if (season.seasonNumber === 0) season.order = 100;
    await useCases.updateSeason().execute(season.id, season);

    notificationService.mutateSeries(show);
    return season;
  }

  async ensureEpisode(
    season: Season,
    episodeMetadata: Episode,
    realSeason: number | undefined,
    realEpisode: number | undefined,
    library: Library,
    videoSrc: string
  ): Promise<EpisodeLocal | null> {
    const episodes = await useCases.getEpisodesBySeasonId().execute(season.id);

    let episode: EpisodeLocal | null =
      episodes?.find((ep) =>
        realEpisode && realEpisode !== -1
          ? ep.episodeNumber === realEpisode
          : ep.episodeNumber === episodeMetadata.episode_number
      ) ?? null;

    if (episode) return episode;

    // Create episode if not exists
    episode = await useCases.createEpisode().execute({
      seasonId: season.id,
      seasonNumber: season.seasonNumber,
      name: episodeMetadata.name ?? "",
      overview: episodeMetadata.overview ?? "",
      year: episodeMetadata.air_date ?? "",
      score: episodeMetadata.vote_average
        ? (episodeMetadata.vote_average * 10.0) / 10.0
        : 0,
      episodeNumber:
        realEpisode && realEpisode !== -1
          ? realEpisode
          : episodeMetadata.episode_number ?? 0,
    });

    if (!episode) return null;

    // Save file in library log
    await useCases.addAnalyzedFile().execute(library.id, videoSrc, episode.id);

    return episode;
  }

  async resolveEpisodeMetadata(
    show: Series,
    videoSrc: string,
    seasonsMetadata: TvSeasonResponse[],
    seasonsIndex: Map<
      number,
      { season: TvSeasonResponse; episodesMap: Map<number, Episode> }
    >,
    cumulativeEpisodes: number[],
    episodesGroup?: EpisodeGroupResponse
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
    const seasonEpisode: [number, number?] =
      this.extractEpisodeSeason(fullName);

    if (Number.isNaN(seasonEpisode)) {
      return { seasonMetadata, episodeMetadata };
    }

    // Absolute number
    if (!seasonEpisode[1]) {
      const absoluteNumber = seasonEpisode[0];
      const result = this.getSeasonEpisodeByAbsoluteNumber(
        absoluteNumber,
        seasonsMetadata,
        cumulativeEpisodes
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
        episodesGroup
      );

      seasonMetadata = resolved?.seasonMetadata ?? null;
      episodeMetadata = resolved?.episodeMetadata ?? null;
    }

    return { seasonMetadata, episodeMetadata, realSeason, realEpisode };
  }

  async resolveEpisodeBySeasonEpisode(
    show: Series,
    episodeNumber: number,
    seasonNumber: number,
    seasonsMetadata: TvSeasonResponse[],
    seasonsIndex: Map<
      number,
      { season: TvSeasonResponse; episodesMap: Map<number, Episode> }
    >,
    episodesGroup?: EpisodeGroupResponse
  ): Promise<{
    seasonMetadata?: TvSeasonResponse;
    episodeMetadata?: Episode;
  } | null> {
    // Look for the season in the metadata
    const exists = seasonsMetadata.some(
      (s) => s.season_number === seasonNumber
    );

    if (!exists && show.episodeGroupId) {
      if (!episodesGroup) {
        episodesGroup = await this.metadataProvider.getEpisodeGroup(
          show.episodeGroupId
        );
      }
      if (!episodesGroup?.groups) return null;

      for (const group of episodesGroup.groups) {
        if (group.order !== seasonNumber || !group.episodes) continue;
        const ep = group.episodes.find(
          (e) => e.order && e.order + 1 === episodeNumber
        );
        if (!ep) continue;

        const seasonMeta = seasonsMetadata.find(
          (s) => s.season_number === ep.season_number
        );
        const episodeMeta = seasonMeta?.episodes?.find(
          (e) => e.episode_number === ep.episode_number
        );

        if (seasonMeta && episodeMeta) {
          return { seasonMetadata: seasonMeta, episodeMetadata: episodeMeta };
        }
      }
      return null;
    }

    // Fast index
    const seasonData = seasonsIndex.get(seasonNumber);
    if (seasonData && seasonData.episodesMap.has(episodeNumber)) {
      return {
        seasonMetadata: seasonData.season,
        episodeMetadata: seasonData.episodesMap.get(episodeNumber)!,
      };
    }

    return null;
  }

  // Returns the season and episode by absolute number
  getSeasonEpisodeByAbsoluteNumber(
    absoluteNumber: number,
    seasonsMetadata: TvSeasonResponse[],
    cumulative: number[]
  ): { season: TvSeasonResponse; episode: MovieDBEpisode } | null {
    for (let i = 0; i < cumulative.length; i++) {
      if (absoluteNumber <= cumulative[i]) {
        const season = seasonsMetadata[i];
        const previousCount = i > 0 ? cumulative[i - 1] : 0;
        const episodeIndex = absoluteNumber - previousCount - 1; // Index from 0
        if (season.episodes && season.episodes[episodeIndex]) {
          return { season, episode: season.episodes[episodeIndex] };
        }
      }
    }
    return null;
  }

  /**
   * Function to detect episode and season numbers in a video file name
   * @param filename path to the video file
   * @returns array of 1 to 2 elements corresponding with the episode and season number detected, or NaN if no episode was found
   */
  extractEpisodeSeason(filename: string): [number, number?] {
    const regexPatterns = [
      /[Ss](\d{1,4})[Ee](\d{1,4})(?:v\d+)?/i, // S01E02, s1e2, S1.E2, S01E01v2
      /[Ss](\d{1,4})[\.]?E(\d{1,4})(?:v\d+)?/i, // S1.E2, S1.E2v1
      /[Ss](\d{1,4})[\s\-]+Ep?(\d{1,4})(?:v\d+)?/i, // S01 E02, S1 E2, con v2 opcional
      /-\s?(\d{1,4})(?:v\d+)?(?!p)/, // - 01, - 01v1 (anime style)
      /(?:\b|^)(\d{1,4})(?:[^\d]+(\d{1,4}))?/i, // General case
    ];

    for (const regex of regexPatterns) {
      const match = filename.match(regex);
      if (match) {
        let episode, season;
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

    return [NaN]; // Return NaN if no episode found
  }

  // Index episodes and seasons of a show to quicker access
  indexSeasons(
    seasonsMetadata: TvSeasonResponse[]
  ): Map<
    number,
    { season: TvSeasonResponse; episodesMap: Map<number, MovieDBEpisode> }
  > {
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

  // Function to build an array with the cumulative count of episodes by season.
  buildCumulativeEpisodes(seasonsMetadata: TvSeasonResponse[]): number[] {
    const cumulative: number[] = [];
    let total = 0;

    for (const season of seasonsMetadata) {
      if (
        season.season_number != null &&
        season.season_number >= 1 &&
        season.episodes
      ) {
        total += season.episodes.length;
        cumulative.push(total);
      }
    }
    return cumulative;
  }
}
