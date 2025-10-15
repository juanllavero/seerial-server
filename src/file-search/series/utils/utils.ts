import { addEpisode, getEpisodes } from "@/api/v0/episodes/episodes.service";
import {
  Episode as EpisodeLocal,
  Library,
  Season,
  Series,
} from "@/api/v0/index.models";
import { addSeason, getSeasons } from "@/api/v0/seasons/seasons.service";
import {
  extractEpisodeSeason,
  getSeasonEpisodeByAbsoluteNumber,
} from "@/file-search/utils/utils";
import { MetadataManager } from "@/managers/MetadataManager";
import { WebSocketManager } from "@/managers/WebSocketManager";
import { MovieDBWrapper } from "@/theMovieDB/MovieDB";
import {
  Episode,
  EpisodeGroupResponse,
  TvSeasonResponse,
} from "moviedb-promise";
import path from "path";

export async function ensureSeason(
  show: Series,
  seasonMetadata: TvSeasonResponse,
  realSeason?: number,
  realEpisode?: number,
  wsManager?: WebSocketManager
): Promise<Season | null> {
  const seasons = await getSeasons(show.id);
  let season: Season | null =
    seasons?.find((s: Season) =>
      realEpisode !== -1 && realSeason
        ? s.seasonNumber === realSeason
        : s.seasonNumber === seasonMetadata.season_number
    ) ?? null;

  if (season) return season;

  season = await addSeason({
    seriesId: show.id,
    name: seasonMetadata.name ?? "",
    year: seasonMetadata.episodes?.[0]?.air_date ?? "",
    overview: seasonMetadata.overview ?? show.overview,
    seasonNumber:
      realEpisode !== -1 ? realSeason ?? 0 : seasonMetadata.season_number ?? 0,
  });

  if (!season) return null;

  // Update metadata
  await MetadataManager.updateSeasonMetadata(season, show);

  if (season.seasonNumber === 0) season.order = 100;
  await season.save();

  if (wsManager) WebSocketManager.mutateSeries(wsManager, show);
  return season;
}

export async function ensureEpisode(
  season: Season,
  episodeMetadata: Episode,
  realSeason: number | undefined,
  realEpisode: number | undefined,
  library: Library,
  videoSrc: string
): Promise<EpisodeLocal | null> {
  const episodes = await getEpisodes(season.id);

  let episode: EpisodeLocal | null =
    episodes?.find((ep) =>
      realEpisode && realEpisode !== -1
        ? ep.episodeNumber === realEpisode
        : ep.episodeNumber === episodeMetadata.episode_number
    ) ?? null;

  if (episode) return episode;

  // Create episode if not exists
  episode = await addEpisode({
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
  await library.addAnalyzedFile(videoSrc, episode.id);

  return episode;
}

export async function resolveEpisodeMetadata(
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
  const seasonEpisode: [number, number?] = extractEpisodeSeason(fullName);

  if (Number.isNaN(seasonEpisode)) {
    return { seasonMetadata, episodeMetadata };
  }

  // Absolute number
  if (!seasonEpisode[1]) {
    const absoluteNumber = seasonEpisode[0];
    const result = getSeasonEpisodeByAbsoluteNumber(
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

    const resolved = await resolveEpisodeBySeasonEpisode(
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

export async function resolveEpisodeBySeasonEpisode(
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
  const exists = seasonsMetadata.some((s) => s.season_number === seasonNumber);

  if (!exists && show.episodeGroupId) {
    if (!episodesGroup) {
      episodesGroup = await MovieDBWrapper.getEpisodeGroup(show.episodeGroupId);
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
