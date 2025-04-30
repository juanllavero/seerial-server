import express from "express";
import { EpisodeData } from "../../../data/interfaces/EpisodeData";
import { DataManager } from "../../../db/DataManager";
import { Downloader } from "../../../downloaders/Downloader";
import { FileSearch } from "../../../fileSearch/FileSearch";
import { MovieDBWrapper } from "../../../theMovieDB/MovieDB";
import { IMDBScores } from "../../../utils/IMDBScores";
import { Utils } from "../../../utils/Utils";
import { WebSocketManager } from "../../../WebSockets/WebSocketManager";
const router = express.Router();

// Get libraries
router.get("/libraries", (_req, res) => {
  const data = DataManager.loadData();
  res.json(data);
});

// Search files in library
router.get("/library/search", async (req: any, res: any) => {
  const { libraryId } = req.query;

  const library = DataManager.getLibrary(libraryId);

  if (!library) return;

  await FileSearch.clearLibrary(libraryId, WebSocketManager.getInstance());

  FileSearch.scanFiles(library, WebSocketManager.getInstance(), false);

  res.json({});
});

// Search movies in TheMovieDB
router.get("/movies/search", (req: any, res: any) => {
  const { name, year } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Param name not found" });
  }

  MovieDBWrapper.searchMovies(name, year, 1).then((data) => res.json(data));
});

// Search episode groups in TheMovieDB
router.get("/episodeGroups/search", (req: any, res: any) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: "Param id not found" });
  }

  MovieDBWrapper.searchEpisodeGroups(id).then((data) => res.json(data));
});

// Test endpoint to get the IMDB score given a IMDB ID
router.get("/imdbScore", (req: any, res: any) => {
  const id = req.query.id;

  IMDBScores.getIMDBScore(id).then((data) => res.json(data));
});

// Test endpoint to get chapters
router.get("/chapters", async (req: any, res: any) => {
  const path = req.query.path;

  const episode: EpisodeData = {
    id: "",
    name: "",
    overview: "",
    year: "",
    nameLock: false,
    yearLock: false,
    overviewLock: false,
    order: 0,
    runtime: 0,
    runtimeInSeconds: 0,
    episodeNumber: 0,
    seasonNumber: 0,
    videoSrc: path,
    imgSrc: "",
    imgUrls: [],
    seasonID: "",
    watched: false,
    timeWatched: 0,
    chapters: [],
    videoTracks: [],
    audioTracks: [],
    subtitleTracks: [],
  };

  res.json(await Utils.getChapters(episode));
});

// Test endpoint to get media info
router.get("/mediaInfo", async (req: any, res: any) => {
  const path = req.query.path;

  const episode: EpisodeData = {
    id: "",
    name: "",
    overview: "",
    year: "",
    nameLock: false,
    yearLock: false,
    overviewLock: false,
    order: 0,
    runtime: 0,
    runtimeInSeconds: 0,
    episodeNumber: 0,
    seasonNumber: 0,
    videoSrc: path,
    imgSrc: "",
    imgUrls: [],
    seasonID: "",
    watched: false,
    timeWatched: 0,
    chapters: [],
    videoTracks: [],
    audioTracks: [],
    subtitleTracks: [],
  };

  await Utils.getMediaInfo(episode);

  res.json(episode);
});

// Get search videos results
router.get("/media/search", async (req: any, res: any) => {
  const { query } = req.query;

  if (typeof query !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const data = await Downloader.searchVideos(query, 20);
  res.json(data);
});

// Search shows in TheMovieDB
router.get("/shows/search", (req: any, res: any) => {
  const { name, year } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Param name not found" });
  }

  MovieDBWrapper.searchTVShows(name, year, 1).then((data) => res.json(data));
});

export default router;
