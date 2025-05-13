import express from "express";
import { Video } from "../../../data/models/Media/Video.model";
import {
  getEpisodeById,
  getLibraryById,
  getMovieById,
  getMovieFromMyList,
  getSeasonById,
  getSeriesById,
  getSeriesFromMyList,
  getVideoByEpisodeId,
  getVideoById,
} from "../../../db/get/getData";
import { Utils } from "../../../utils/Utils";
const router = express.Router();

// Get media info
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

router.get("/videoInfo", async (req: any, res: any) => {
  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const video = await getVideoById(id);

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

    const series = await getSeriesById(season.seriesId);

    if (!series) {
      return res.status(404).json({ error: "Series not found" });
    }

    const library = await getLibraryById(series.libraryId);

    if (!library) {
      return res.status(404).json({ error: "Library not found" });
    }

    return res.json({
      title: series.name,
      subtitle: `S${episode.seasonNumber}E${episode.episodeNumber}`,
      preferAudioLan: series.preferAudioLan || library.preferAudioLan,
      preferSubtitleLan: series.preferSubLan || library.preferSubLan,
      subsMode: series.subsMode || library.subsMode,
    });
  } else if (video.movieId) {
    const movie = await getMovieById(video.movieId);

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    const library = await getLibraryById(movie.libraryId);

    if (!library) {
      return res.status(404).json({ error: "Library not found" });
    }

    const year = new Date(movie.year).getFullYear();

    return res.json({
      title: movie.name,
      subtitle: `(${year})`,
      preferAudioLan: library.preferAudioLan,
      preferSubtitleLan: library.preferSubLan,
      subsMode: library.subsMode,
    });
  }

  return res.status(404).json({ error: "Video data not found" });
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

// Get if a series is in My List
router.get("/isShowInMyList", async (req: any, res: any) => {
  const { seriesId } = req.query;

  if (typeof seriesId !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const isInMyList = await getSeriesFromMyList(seriesId);
  res.json({ isInMyList: isInMyList !== null });
});

// Get if a movie is in My List
router.get("/isMovieInMyList", async (req: any, res: any) => {
  const { movieId } = req.query;

  if (typeof movieId !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const isInMyList = await getMovieFromMyList(movieId);
  res.json({ isInMyList: isInMyList !== null });
});

export default router;
