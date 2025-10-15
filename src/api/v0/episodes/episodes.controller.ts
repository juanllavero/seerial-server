import {
  addVideoToContinueWatching,
  deleteAllVideosFromContinueWatching,
  getCurrentlyWatchingEpisodeId,
  removeVideoFromContinueWatching,
} from "@/api/v0/continue-watching/continue-watching.service";
import { Episode, Season } from "@/api/v0/index.models";
import { getSeasonById } from "@/api/v0/seasons/seasons.service";
import { getSeriesById } from "@/api/v0/series/series.service";
import { getVideoByEpisodeId } from "@/api/v0/videos/videos.service";
import {
  addSeasonToWatchList,
  addSeriesToWatchList,
  addVideoToWatchList,
  removeSeasonFromWatchList,
  removeSeriesFromWatchList,
  removeVideoFromWatchList,
} from "@/api/v0/watch-lists/watch-lists.service";
import { getEpisodeById } from "./episodes.service";

export const setEpisodeWatchState = async (
  season: Season,
  episodeToUpdate: Episode,
  state: boolean,
  userId: string
) => {
  const series = await getSeriesById(season.seriesId);
  if (!series || series.seasons.length === 0) return;

  // Store previous episode marked as 'currently watching'
  const previousEpisodeId = await getCurrentlyWatchingEpisodeId(series.id);
  let nextEpisodeId: string | null = null;

  // Sort seasons
  const seasons = (
    await Promise.all(series.seasons.map((s) => getSeasonById(s.id)))
  )
    .filter((s): s is Season => !!s)
    .sort((a, b) => a.seasonNumber - b.seasonNumber);

  for (const s of seasons) {
    const episodes = (
      await Promise.all(s.episodes.map((e) => getEpisodeById(e.id)))
    )
      .filter((e): e is Episode => !!e)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);

    if (s.seasonNumber < season.seasonNumber) {
      for (const e of episodes) {
        const video = await getVideoByEpisodeId(e.id);
        if (!video) continue;
        await addVideoToWatchList(video.id, userId);
        await video.save();
      }
      await addSeasonToWatchList(s.id, userId);
      await s.save();
      continue;
    }

    if (s.seasonNumber > season.seasonNumber) {
      for (const e of episodes) {
        const video = await getVideoByEpisodeId(e.id);
        if (!video) continue;
        await removeVideoFromWatchList(video.id, userId);
        await video.save();
      }
      await removeSeasonFromWatchList(s.id, userId);
      await s.save();
      continue;
    }

    // Current season
    let allWatchedThisSeason = true;

    for (let i = 0; i < episodes.length; i++) {
      const e = episodes[i];
      const video = await getVideoByEpisodeId(e.id);
      if (!video) continue;

      if (e.episodeNumber < episodeToUpdate.episodeNumber) {
        await addVideoToWatchList(video.id, userId);
      } else if (e.episodeNumber === episodeToUpdate.episodeNumber) {
        if (state) {
          await addVideoToWatchList(video.id, userId);
        }

        if (state === false) {
          nextEpisodeId = e.id;
        } else {
          if (i < episodes.length - 1) {
            nextEpisodeId = episodes[i + 1].id;
          } else {
            const seasonIdx = seasons.findIndex((ss) => ss.id === s.id);
            if (seasonIdx < seasons.length - 1) {
              const nextSeason = await getSeasonById(seasons[seasonIdx + 1].id);
              if (nextSeason) {
                const nextSeasonEpisodes = (
                  await Promise.all(
                    nextSeason.episodes.map((ne) => getEpisodeById(ne.id))
                  )
                )
                  .filter((ne): ne is Episode => !!ne)
                  .sort((a, b) => a.episodeNumber - b.episodeNumber);
                nextEpisodeId = nextSeasonEpisodes[0]?.id ?? null;
              }
            } else {
              nextEpisodeId = null; // last episode
            }
          }
        }
      } else {
        await removeVideoFromWatchList(video.id, userId);
      }
      await video.save();

      const filteredWatchList = video.watchLists.filter(
        (wl) => wl.userId === userId
      );
      if (filteredWatchList.length === 0) allWatchedThisSeason = false;
    }

    if (allWatchedThisSeason) {
      await addSeasonToWatchList(s.id, userId);
    } else {
      await removeSeasonFromWatchList(s.id, userId);
    }

    await s.save();
  }

  await deleteAllVideosFromContinueWatching(userId, series.id);

  //Update series and continue watching
  if (previousEpisodeId && previousEpisodeId.video?.episode?.id) {
    const prevVideo = await getVideoByEpisodeId(
      previousEpisodeId.video?.episode?.id
    );
    if (prevVideo) {
      await removeVideoFromContinueWatching(prevVideo.id, userId);
    }
  }

  if (!nextEpisodeId) {
    await addSeriesToWatchList(series.id, userId);
  } else {
    await removeSeriesFromWatchList(series.id, userId);
  }

  await series.save();

  if (nextEpisodeId) {
    const nextVideo = await getVideoByEpisodeId(nextEpisodeId);
    if (nextVideo) {
      await addVideoToContinueWatching(nextVideo.id, userId, series.id);
    }
  }
};
