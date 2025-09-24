import { Router } from "express";
import {
  getEpisodeById,
  getMovieById,
  getMovieFromMyList,
  getSeasonById,
  getSeriesById,
  getSeriesFromMyList,
  getVideoByEpisodeId,
  getVideoById,
} from "../../../db/get/getData";
import {
  addMovieToMyList,
  addMovieToWatchList,
  addSeasonToWatchList,
  addSeriesToMyList,
  addSeriesToWatchList,
  addVideoToContinueWatching,
  addVideoToWatchList,
  removeMovieFromMyList,
  removeMovieFromWatchList,
  removeSeasonFromWatchList,
  removeSeriesFromMyList,
  removeSeriesFromWatchList,
  removeVideoFromContinueWatching,
  removeVideoFromWatchList,
} from "../../../db/post/postData";
import { Utils } from "../../../utils/Utils";

const router = Router();

// Set movie watched state
router.post("/setMovieWatched", async (req: any, res: any) => {
  const { movieId, watched, userId } = req.body;

  if (!movieId || !userId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const movie = await getMovieById(movieId);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  if (watched) {
    await addMovieToWatchList(movieId, userId);
  } else {
    await removeMovieFromWatchList(movieId, userId);
  }
  await movie.save();

  // Manage continue watching for all movie videos
  for (const video of movie.videos) {
    if (
      watched === false &&
      video.watchLists.filter((wl) => wl.id === userId).length > 0 &&
      (video.watchLists.filter((wl) => wl.id === userId)[0]?.timeWatched ?? 0) >
        0
    ) {
      await addVideoToContinueWatching(video.id, userId);
    } else if (watched === true) {
      await removeVideoFromContinueWatching(video.id, userId);
    }
  }

  return res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set video watched state
router.post("/setVideoWatched", async (req: any, res: any) => {
  const { videoId, watched, userId } = req.body;

  if (!videoId || !userId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ error: "Video not found" });
  }

  if (watched) {
    await addVideoToWatchList(videoId, userId);
  } else {
    await removeVideoFromWatchList(videoId, userId);
  }
  await video.save();

  return res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set show watched state
router.post("/setSeriesWatched", async (req: any, res: any) => {
  const { seriesId, watched, userId } = req.body;

  if (!seriesId || !userId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const series = await getSeriesById(seriesId);

  if (!series) {
    return res.status(404).json({ error: "Series not found" });
  }

  for (const season of series.seasons) {
    const seasonWithEpisodes = await getSeasonById(season.id);

    if (!seasonWithEpisodes) continue;

    for (const episode of seasonWithEpisodes.episodes) {
      const episodeDB = await getEpisodeById(episode.id);

      if (!episodeDB) continue;

      const video = await getVideoByEpisodeId(episodeDB.id);

      if (!video) continue;

      if (watched) {
        await addVideoToWatchList(video.id, userId);
      } else {
        await removeVideoFromWatchList(video.id, userId);
      }
      await video.save();

      // Manage continue watching
      if (watched === true) {
        await removeVideoFromContinueWatching(video.id, userId);
      }
    }

    if (watched) {
      await addSeasonToWatchList(seasonWithEpisodes.id, userId);
    } else {
      await removeSeasonFromWatchList(seasonWithEpisodes.id, userId);
    }
    await seasonWithEpisodes.save();
  }

  if (watched) {
    await addSeriesToWatchList(seriesId, userId);
  } else {
    await removeSeriesFromWatchList(seriesId, userId);
  }
  await series.save();

  return res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set season watched state
router.post("/setSeasonWatched", async (req: any, res: any) => {
  const { seasonId, watched, userId } = req.body;

  if (!userId || !seasonId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const season = await getSeasonById(seasonId);

  if (!season) {
    return res.status(404).json({ error: "Season not found" });
  }

  // Get first or last episode
  const episodeIndex = watched === true ? season.episodes.length - 1 : 0;
  const episode = season.episodes.sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  )[episodeIndex];

  // Set episode watched state
  await Utils.setEpisodeWatchState(season, episode, watched, userId);
  return res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set episode watched state
router.post("/setEpisodeWatched", async (req: any, res: any) => {
  const { episodeId, watched, userId } = req.body;

  if (!userId || !episodeId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const episode = await getEpisodeById(episodeId);

  if (!episode) {
    return res.status(404).json({ error: "Episode not found" });
  }

  const season = await getSeasonById(episode.seasonId);

  if (!season) {
    return res.status(404).json({ error: "Season not found" });
  }

  await Utils.setEpisodeWatchState(season, episode, watched, userId);

  return res.json({ message: "WATCH_STATE_UPDATED" });
});

// Add/remove series from My List
router.post("/updateSeriesMyList", async (req: any, res: any) => {
  const { seriesId, userId } = req.body;

  if (!userId || !seriesId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  if (await getSeriesFromMyList(seriesId, userId)) {
    await removeSeriesFromMyList(seriesId, userId);
  } else {
    await addSeriesToMyList(seriesId, userId);
  }

  res.json({ message: "MY_LIST_UPDATED" });
});

// Add/remove movie from My List
router.post("/updateMovieMyList", async (req: any, res: any) => {
  const { movieId, userId } = req.body;

  if (!userId || !movieId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  if (await getMovieFromMyList(movieId, userId)) {
    await removeMovieFromMyList(movieId, userId);
  } else {
    await addMovieToMyList(movieId, userId);
  }

  res.json({ message: "MY_LIST_UPDATED" });
});

export default router;
