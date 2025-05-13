import express from "express";
import {
  getEpisodeById,
  getMovieById,
  getSeasonById,
  getVideoById,
} from "../../db/get/getData";
import { addVideoToContinueWatching } from "../../db/post/postData";
import {
  updateEpisode,
  updateLibrary,
  updateSeason,
  updateSeries,
} from "../../db/update/updateData";
import { Utils } from "../../utils/Utils";
const router = express.Router();

// Update Library
router.put("/library", (req, res) => {
  const { libraryId, updatedLibrary } = req.body;

  try {
    updateLibrary(libraryId, updatedLibrary);
    res.status(200).json({ message: "Library updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update library" });
  }
});

// Update Show
router.put("/show", (req, res) => {
  const { showId, updatedShow } = req.body;

  try {
    updateSeries(showId, updatedShow);
    res.status(200).json({ message: "Show updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update show" });
  }
});

// Update Season
router.put("/season", (req, res) => {
  const { seasonId, updatedSeason } = req.body;

  try {
    updateSeason(seasonId, updatedSeason);
    res.status(200).json({ message: "Season updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update season" });
  }
});

// Update Episode
router.put("/episode", (req, res) => {
  const { episodeId, updatedEpisode } = req.body;

  try {
    updateEpisode(episodeId, updatedEpisode);
    res.status(200).json({ message: "Episode updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update episode" });
  }
});

// Test endpoint to get media info
router.put("/updateMediaInfo", async (req: any, res: any) => {
  const { videoId } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ error: "Video not found" });
  }

  res.json(await Utils.getMediaInfo(video));
});

router.put("/updateWatchState", async (req: any, res: any) => {
  const { videoId, timeWatched, watched } = req.body;

  if (!videoId || !timeWatched || !watched) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ error: "Video not found" });
  }

  if (video.episodeId) {
    const episode = await getEpisodeById(video.episodeId);

    if (!episode) {
      return res.status(404).json({ error: "Episode not found" });
    }

    const season = await getSeasonById(episode.seasonId);

    if (!season) {
      return res.status(404).json({ error: "Season not found" });
    }

    await Utils.setEpisodeWatchState(season, episode, watched);
  } else if (video.movieId) {
    const movie = await getMovieById(video.movieId);

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    video.watched = watched;
    movie.watched =
      movie.videos.filter((v) => (v.id === video.id ? watched : v.watched))
        .length === movie.videos.length;
    await movie.save();
  }

  video.timeWatched = timeWatched;
  video.lastWatched = new Date().toLocaleString();
  await video.save();

  await addVideoToContinueWatching(videoId);
});

export default router;
