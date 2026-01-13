import { Library } from "@/api/v0/libraries/domain/Library";
import { Season } from "@/api/v0/seasons/domain/Season";
import { FileSystemServicePort } from "@/api/v0/shared/application/ports/FileSystemServicePort";
import { MetadataProviderPort } from "@/api/v0/shared/application/ports/MetadataProviderPort";
import {
  notificationService,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { MetadataManager } from "@/managers/MetadataManager";
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
    if (!(await this.fileSystemService.isFolder(root))) return;

    const videoFiles = await this.fileSystemService.getValidVideoFiles(root);
    if (videoFiles.length === 0) return;

    let show: Series | null = null;
    let exists: boolean = false;

    if (root in library.analyzedFolders) {
      show = await useCases
        .getSeriesById()
        .execute(library.analyzedFolders[root] ?? "");
      if (show !== null) exists = true;
    }

    if (show === null) {
      show = await useCases.createSeries().execute({
        folder: root,
        libraryId: library.id,
      });
      if (!show) return;
      await useCases.addAnalyzedFolder().execute(library.id, root, show.id);
    }

    // Search for themdbId
    if (show.themdbId === -1) {
      let finalName: string = root.split(/[/\\]/).pop() ?? "";
      const pattern = /^(.*?)(?:\s(\d{4}))?$/;
      let year: string | undefined = "1";
      const matcher = finalName.replace(/[()]/g, "").match(pattern);

      if (matcher) {
        finalName = matcher[1];
        year = matcher[2] ?? "1";
      }

      const showsSearch = await this.metadataProvider.searchTVShows(
        finalName,
        year
      );
      if (!showsSearch || showsSearch.length === 0) return;

      show.themdbId = showsSearch[0].id ?? -1;
    }

    // Update series metadata
    await MetadataManager.updateSeriesMetadata(show, library.language);

    show.analyzingFiles = true;
    await useCases.updateSeries().execute(show.id, show);

    notificationService.mutateSeries(show);

    // Download seasons metadata
    const showData = await this.metadataProvider.getTVShow(
      show.themdbId,
      library.language
    );
    if (!showData?.seasons) return;

    const seasonPromises = showData.seasons.map((seasonBasic) =>
      this.metadataProvider.getSeason(
        showData.id!,
        seasonBasic.season_number!,
        library.language
      )
    );
    const seasonsMetadata = (await Promise.all(seasonPromises)).filter(
      Boolean
    ) as TvSeasonResponse[];
    if (seasonsMetadata.length === 0) return;

    // Download episode groups metadata if needed
    const episodesGroup = show.episodeGroupId
      ? await this.metadataProvider.getEpisodeGroup(show.episodeGroupId)
      : undefined;

    await this.processEpisodes(
      library,
      videoFiles,
      show,
      seasonsMetadata,
      episodesGroup
    );

    const seasons = await useCases.getSeasons().execute(show.id);
    if (!seasons || seasons.length < 1) {
      await useCases.deleteSeries().execute(show.id);
      return;
    }

    show.analyzingFiles = false;
    await useCases.updateSeries().execute(show.id, show);

    notificationService.mutateSeries(show);
  }

  // Process each video file
  async processEpisodes(
    library: Library,
    videoFiles: string[],
    show: Series,
    seasonsMetadata: TvSeasonResponse[],
    episodesGroup: EpisodeGroupResponse | undefined
  ) {
    const seasonsIndex = this.indexSeasons(seasonsMetadata);
    const cumulativeEpisodes = this.buildCumulativeEpisodes(seasonsMetadata);

    for (const videoFile of videoFiles) {
      if (
        !library.analyzedFiles[videoFile] ||
        !(await useCases.getEpisodeByPath().execute(videoFile))
      ) {
        await this.processEpisode(
          library,
          show,
          videoFile,
          seasonsMetadata,
          seasonsIndex,
          cumulativeEpisodes,
          episodesGroup
        );
      }
    }

    const seasons = await useCases.getSeasons().execute(show.id);
    if (!seasons) return;

    // Rename seasons after episodes group
    if (show.episodeGroupId && episodesGroup?.groups) {
      for (const season of seasons) {
        const group = episodesGroup.groups.find(
          (g) => g.order === season.seasonNumber
        );
        if (group) {
          season.name = group.name ?? season.name;
          await useCases.updateSeason().execute(season.id, season);
        }
      }
    } else if (seasons.length > 1 && seasons[0].name === seasons[1].name) {
      for (const season of seasons) {
        if (season.seasonNumber !== 0) {
          season.name = `Season ${season.seasonNumber}`;
          await useCases.updateSeason().execute(season.id, season);
        }
      }
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
    const { seasonMetadata, episodeMetadata, realSeason, realEpisode } =
      await this.resolveEpisodeMetadata(
        show,
        videoSrc,
        seasonsMetadata,
        seasonsIndex,
        cumulativeEpisodes,
        episodesGroup
      );

    if (!seasonMetadata || !episodeMetadata) return;

    // Ensure season in DB
    const season = await this.ensureSeason(
      show,
      seasonMetadata,
      realSeason,
      realEpisode
    );
    if (!season) return;

    // Ensure episode in DB
    let episode = await this.ensureEpisode(
      season,
      episodeMetadata,
      realSeason,
      realEpisode,
      library,
      videoSrc
    );
    if (!episode) return;

    // Ensure video in DB
    let video = await useCases.getVideoByEpisodeId().execute(episode.id);
    if (!video) {
      video = await useCases.addVideoAsEpisode().execute(episode.id, {
        fileSrc: videoSrc,
      });
      if (!video) return;
    }

    // Update episode metadata
    await MetadataManager.updateEpisodeMetadata(
      episode,
      video,
      show,
      episodeMetadata
    );

    // Notify changes in clients
    notificationService.mutateSeason();
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
    await MetadataManager.updateSeasonMetadata(season, show);

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
