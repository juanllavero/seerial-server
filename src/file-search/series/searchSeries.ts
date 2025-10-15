import { getEpisodeByPath } from "@/api/v0/episodes/episodes.service";
import { Library, Series } from "@/api/v0/index.models";
import { getSeasons } from "@/api/v0/seasons/seasons.service";
import {
  addSeries,
  deleteSeries,
  getSeriesById,
} from "@/api/v0/series/series.service";
import {
  addVideoAsEpisode,
  getVideoByEpisodeId,
} from "@/api/v0/videos/videos.service";
import {
  buildCumulativeEpisodes,
  indexSeasons,
} from "@/file-search/utils/utils";
import { FilesManager } from "@/managers/FilesManager";
import { MetadataManager } from "@/managers/MetadataManager";
import { WebSocketManager } from "@/managers/WebSocketManager";
import { MovieDBWrapper } from "@/theMovieDB/MovieDB";
import {
  Episode,
  EpisodeGroupResponse,
  TvSeasonResponse,
} from "moviedb-promise";
import {
  ensureEpisode,
  ensureSeason,
  resolveEpisodeMetadata,
} from "./utils/utils";

export async function scanTVShow(
  library: Library,
  folder: string,
  wsManager: WebSocketManager
) {
  if (!(await FilesManager.isFolder(folder))) return;

  const videoFiles = await FilesManager.getValidVideoFiles(folder);
  if (videoFiles.length === 0) return;

  let show: Series | null = null;
  let exists: boolean = false;

  if (folder in library.analyzedFolders) {
    show = await getSeriesById(library.analyzedFolders[folder] ?? "");
    if (show !== null) exists = true;
  }

  if (show === null) {
    show = await addSeries({
      folder,
      libraryId: library.id,
    });
    if (!show) return;
    await library.addAnalyzedFolder(folder, show.id);
  }

  // Search for themdbId
  if (show.themdbId === -1) {
    let finalName: string = folder.split(/[/\\]/).pop() ?? "";
    const pattern = /^(.*?)(?:\s(\d{4}))?$/;
    let year: string | undefined = "1";
    const matcher = finalName.replace(/[()]/g, "").match(pattern);

    if (matcher) {
      finalName = matcher[1];
      year = matcher[2] ?? "1";
    }

    const showsSearch = await MovieDBWrapper.searchTVShows(finalName, year, 1);
    if (!showsSearch || showsSearch.length === 0) return;

    show.themdbId = showsSearch[0].id ?? -1;
  }

  // Update series metadata
  await MetadataManager.updateSeriesMetadata(show, library.language);

  show.analyzingFiles = true;
  await show.save();

  WebSocketManager.mutateSeries(wsManager, show);

  // Download seasons metadata
  const showData = await MovieDBWrapper.getTVShow(
    show.themdbId,
    library.language
  );
  if (!showData?.seasons) return;

  const seasonPromises = showData.seasons.map((seasonBasic) =>
    MovieDBWrapper.getSeason(
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
    ? await MovieDBWrapper.getEpisodeGroup(show.episodeGroupId)
    : undefined;

  await processEpisodes(
    library,
    videoFiles,
    show,
    seasonsMetadata,
    episodesGroup,
    wsManager
  );

  const seasons = await getSeasons(show.id);
  if (!seasons || seasons.length < 1) {
    await deleteSeries(show.id);
    return;
  }

  show.analyzingFiles = false;
  await show.save();

  WebSocketManager.mutateSeries(wsManager, show);
}

// Process each video file
export async function processEpisodes(
  library: Library,
  videoFiles: string[],
  show: Series,
  seasonsMetadata: TvSeasonResponse[],
  episodesGroup: EpisodeGroupResponse | undefined,
  wsManager: WebSocketManager
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
        episodesGroup,
        wsManager
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
export async function processEpisode(
  library: Library,
  show: Series,
  videoSrc: string,
  seasonsMetadata: TvSeasonResponse[],
  seasonsIndex: Map<
    number,
    { season: TvSeasonResponse; episodesMap: Map<number, Episode> }
  >,
  cumulativeEpisodes: number[],
  episodesGroup: EpisodeGroupResponse | undefined,
  wsManager: WebSocketManager
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
    realEpisode,
    wsManager
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
  WebSocketManager.mutateSeason(wsManager);
}
