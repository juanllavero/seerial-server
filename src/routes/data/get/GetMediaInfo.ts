import express from "express";
import { Video } from "../../../data/models/Media/Video.model";
import {
  getMovieById,
  getSeasonById,
  getSeriesById,
  getVideoByEpisodeId,
} from "../../../db/get/getData";
import { Utils } from "../../../utils/Utils";
const router = express.Router();

// Get media info
router.get("/mediaInfo", async (req: any, res: any) => {
  const { libraryId, showId, seasonId, episodeId } = req.query;

  if (
    typeof libraryId !== "string" ||
    typeof showId !== "string" ||
    typeof seasonId !== "string" ||
    typeof episodeId !== "string"
  ) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const videoObject = await getVideoByEpisodeId(episodeId);

  if (!videoObject) return;

  const data = await Utils.getMediaInfo(videoObject);
  res.json(data);
});

router.get("/video-info", async (req: any, res: any) => {
  const { path } = req.query;

  if (typeof path !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const videoObject = new Video({
    fileSrc: path,
  });

  const data = await Utils.getMediaInfo(videoObject);
  res.json(data);
});

// Get remaining episodes
router.get("/remaining-episodes", async (req: any, res: any) => {
  const { seriesId } = req.query;

  if (typeof seriesId !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const series = await getSeriesById(seriesId);

  if (!series) {
    return res.status(404).json({ error: "Series not found" });
  }

  let remainingEpisodes = 0;
  for (const s of series.seasons) {
    const season = await getSeasonById(s.id);

    if (!season) continue;

    for (const episode of season.episodes) {
      const video = await getVideoByEpisodeId(episode.id);
      if (video && !video.watched) {
        remainingEpisodes++;
      }
    }
  }

  res.json({ remainingEpisodes });
});

// Get remaining videos
router.get("/remaining-videos", async (req: any, res: any) => {
  const { movieId } = req.query;

  if (typeof movieId !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const movie = await getMovieById(movieId);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  let remainingVideos = 0;
  for (const video of movie.videos) {
    if (!video.watched) {
      remainingVideos++;
    }
  }

  res.json({ remainingVideos });
});

export default router;
