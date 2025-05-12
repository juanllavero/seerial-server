import express from "express";
import { MovieDb } from "moviedb-promise";
import path from "path";
import propertiesReader from "properties-reader";
import {
  getEpisodeById,
  getMovieById,
  getSeasonById,
  getSeriesById,
  getVideoById,
} from "../../db/get/getData";
import { Downloader } from "../../downloaders/Downloader";
import { FileSearch } from "../../fileSearch/fileSearch";
import {
  updateMovieMetadata,
  updateShowMetadata,
} from "../../fileSearch/updateMetadata";
import { wsManager } from "../../index";
import { MovieDBWrapper } from "../../theMovieDB/MovieDB";
import { FilesManager } from "../../utils/FilesManager";
import { Utils } from "../../utils/Utils";
const router = express.Router();

router.post("/api-key", (req, res) => {
  const { apiKey } = req.body;

  const properties =
    propertiesReader(FilesManager.propertiesFilePath) || undefined;

  // Save API key in properties file
  properties.set("TMDB_API_KEY", apiKey);
  properties.save(FilesManager.propertiesFilePath);

  if (apiKey) {
    const moviedb = new MovieDb(String(apiKey));

    MovieDBWrapper.THEMOVIEDB_API_KEY = apiKey;

    res.json({
      status: moviedb ? "VALID_API_KEY" : "INVALID_API_KEY",
    });
  } else {
    res.json({
      status: "INVALID_API_KEY",
    });
  }
});

// Add library
router.post("/addLibrary", async (req: any, res: any) => {
  const libraryData = req.body;

  const library = await FileSearch.scanFiles(libraryData, wsManager, true);

  return res.status(200).json(library);
});

// Upload image
router.post(
  "/uploadImage",
  FilesManager.upload.single("image"),
  (req: any, res: any) => {
    console.log("Request fields:", req.body);
    const file = req.file;
    const destPath = req.body.destPath;

    console.log({ file, destPath });

    if (!file) {
      return res.status(400).send("No file received");
    }

    if (!destPath) {
      return res.status(400).send("Destination path not specified");
    }

    // Success response
    res
      .status(200)
      .send(
        `Image uploaded successfully to ${path.join(
          destPath,
          file.originalname
        )}`
      );
  }
);

// Download image
router.post("/downloadImage", async (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  if (!Utils.isValidURL(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }

  try {
    await Utils.downloadImage(
      url,
      path.join(FilesManager.resourcesPath, downloadFolder, fileName)
    );
  } catch (error) {
    return res.status(400).json({ error: "Error downloading image" });
  }

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Download video
router.post("/downloadVideo", async (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  await Downloader.downloadVideo(url, downloadFolder, fileName, wsManager);

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Download music
router.post("/downloadMusic", (req: any, res: any) => {
  const { url, downloadFolder, fileName } = req.body;

  if (!url || !downloadFolder || !fileName) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  Downloader.downloadAudio(url, downloadFolder, fileName, wsManager);

  res.json({ message: "DOWNLOAD_FINISHED" });
});

// Update TheMovieDB id for show
router.post("/updateShowId", (req: any, res: any) => {
  const { libraryId, showId, themdbId } = req.body;

  if (!showId || !themdbId || !libraryId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  updateShowMetadata(libraryId, showId, themdbId, wsManager);
});

// Update TheMovieDB id for movie
router.post("/updateMovieId", (req: any, res: any) => {
  const { libraryId, movieId, themdbId } = req.body;

  if (!movieId || !themdbId || !libraryId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  updateMovieMetadata(libraryId, movieId, themdbId, wsManager);
});

// Update episode group for show
router.post("/updateEpisodeGroup", (req: any, res: any) => {
  const { libraryId, showId, themdbId, episodeGroupId } = req.body;

  if (!showId || !themdbId || !episodeGroupId || !libraryId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  updateShowMetadata(libraryId, showId, themdbId, wsManager, episodeGroupId);
});

// Set movie watched state
router.post("/setMovieWatched", async (req: any, res: any) => {
  const { movieId, watched } = req.body;

  if (!movieId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const movie = await getMovieById(movieId);

  if (!movie) {
    return res.status(404).json({ error: "Movie not found" });
  }

  movie.watched = watched;
  await movie.save();

  res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set video watched state
router.post("/setVideoWatched", async (req: any, res: any) => {
  const { videoId, watched } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ error: "Video not found" });
  }

  video.watched = watched;
  await video.save();

  res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set show watched state
router.post("/setSeriesWatched", async (req: any, res: any) => {
  const { seriesId, watched } = req.body;

  if (!seriesId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const series = await getSeriesById(seriesId);

  if (!series) {
    return res.status(404).json({ error: "Series not found" });
  }

  series.watched = watched;
  series.currentlyWatchingEpisodeId = "";
  await series.save();

  res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set season watched state
router.post("/setSeasonWatched", async (req: any, res: any) => {
  const { seasonId, watched } = req.body;

  if (!seasonId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const season = await getSeasonById(seasonId);

  if (!season) {
    return res.status(404).json({ error: "Season not found" });
  }

  // Get last episode in order to set its watched state
  const lastEpisode = season.episodes.sort(
    (a, b) => a.episodeNumber - b.episodeNumber
  )[season.episodes.length - 1];

  // Set last episode watched state
  await Utils.setEpisodeWatchState(season, lastEpisode, watched);

  res.json({ message: "WATCH_STATE_UPDATED" });
});

// Set episode watched state
router.post("/setEpisodeWatched", async (req: any, res: any) => {
  const { episodeId, watched } = req.body;

  if (!episodeId) {
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

  await Utils.setEpisodeWatchState(season, episode, watched);

  res.json({ message: "WATCH_STATE_UPDATED" });
});

export default router;
