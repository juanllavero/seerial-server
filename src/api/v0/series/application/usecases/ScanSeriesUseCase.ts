import { Library } from "@/api/v0/libraries/domain/Library";
import { ProcessMovieFolderUseCase } from "@/api/v0/movies/application/usecases/ProcessMovieFolderUseCase";
import { FileSystemServicePort } from "@/api/v0/shared/application/ports/FileSystemServicePort";
import { MetadataProviderPort } from "@/api/v0/shared/application/ports/MetadataProviderPort";
import { NotificationServicePort } from "@/api/v0/shared/application/ports/NotificationServicePort";
import {
  processEpisode,
  processEpisodes,
} from "@/file-search/series/searchSeries";
import {
  ensureEpisode,
  ensureSeason,
  resolveEpisodeMetadata,
} from "@/file-search/series/utils/utils";
import {
  buildCumulativeEpisodes,
  indexSeasons,
} from "@/file-search/utils/utils";
import { MetadataManager } from "@/managers/MetadataManager";
import {
  Episode,
  EpisodeGroupResponse,
  TvSeasonResponse,
} from "moviedb-promise";
import { Series } from "../../domain/Series";
import { SeriesRepositoryPort } from "../ports/SeriesRepositoryPort";

export class ScanSeriesUseCase {
  constructor(
    private readonly fileSystemService: FileSystemServicePort,
    private readonly processFolderUseCase: ProcessMovieFolderUseCase,
    private readonly seriesRepository: SeriesRepositoryPort,
    private readonly metadataProvider: MetadataProviderPort,
    private readonly notificationService: NotificationServicePort
  ) {}

  async execute(library: Library, root: string): Promise<void> {
    if (!(await this.fileSystemService.isFolder(root))) return;

    const videoFiles = await this.fileSystemService.getValidVideoFiles(root);
    if (videoFiles.length === 0) return;

    let show: Series | null = null;
    let exists: boolean = false;

    if (root in library.analyzedFolders) {
      show = await getSeriesById(library.analyzedFolders[root] ?? "");
      if (show !== null) exists = true;
    }

    if (show === null) {
      show = await addSeries({
        root,
        libraryId: library.id,
      });
      if (!show) return;
      await library.addAnalyzedFolder(root, show.id);
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
        year,
        1
      );
      if (!showsSearch || showsSearch.length === 0) return;

      show.themdbId = showsSearch[0].id ?? -1;
    }

    // Update series metadata
    await MetadataManager.updateSeriesMetadata(show, library.language);

    show.analyzingFiles = true;
    await show.save();

    this.notificationService.mutateSeries(show);

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

    await processEpisodes(
      library,
      videoFiles,
      show,
      seasonsMetadata,
      episodesGroup
    );

    const seasons = await getSeasons(show.id);
    if (!seasons || seasons.length < 1) {
      await deleteSeries(show.id);
      return;
    }

    show.analyzingFiles = false;
    await show.save();

    this.notificationService.mutateSeries(show);
  }

  // Process each video file
  async processEpisodes(
    library: Library,
    videoFiles: string[],
    show: Series,
    seasonsMetadata: TvSeasonResponse[],
    episodesGroup: EpisodeGroupResponse | undefined
  ) {
    const seasonsIndex = indexSeasons(seasonsMetadata);
    const cumulativeEpisodes = buildCumulativeEpisodes(seasonsMetadata);

    for (const videoFile of videoFiles) {
      if (
        !library.analyzedFiles[videoFile] ||
        !(await getEpisodeByPath(videoFile))
      ) {
        await processEpisode(
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

    const seasons = await getSeasons(show.id);
    if (!seasons) return;

    // Rename seasons after episodes group
    if (show.episodeGroupId && episodesGroup?.groups) {
      for (const season of seasons) {
        const group = episodesGroup.groups.find(
          (g) => g.order === season.seasonNumber
        );
        if (group) {
          season.name = group.name ?? season.name;
          await season.save();
        }
      }
    } else if (seasons.length > 1 && seasons[0].name === seasons[1].name) {
      for (const season of seasons) {
        if (season.seasonNumber !== 0) {
          season.name = `Season ${season.seasonNumber}`;
          await season.save();
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
      await resolveEpisodeMetadata(
        show,
        videoSrc,
        seasonsMetadata,
        seasonsIndex,
        cumulativeEpisodes,
        episodesGroup
      );

    if (!seasonMetadata || !episodeMetadata) return;

    // Ensure season in DB
    const season = await ensureSeason(
      show,
      seasonMetadata,
      realSeason,
      realEpisode
    );
    if (!season) return;

    // Ensure episode in DB
    let episode = await ensureEpisode(
      season,
      episodeMetadata,
      realSeason,
      realEpisode,
      library,
      videoSrc
    );
    if (!episode) return;

    // Ensure video in DB
    let video = await getVideoByEpisodeId(episode.id);
    if (!video) {
      video = await addVideoAsEpisode(episode.id, { fileSrc: videoSrc });
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
    this.notificationService.mutateSeason();
  }
}
