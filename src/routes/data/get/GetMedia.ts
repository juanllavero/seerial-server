import express from "express";
import { DataManager } from "../../../data/utils/DataManager";
import { Downloader } from "../../../data/utils/Downloader";
import { FileSearch } from "../../../data/utils/FileSearch";
import { MovieDBWrapper } from "../../../data/utils/MovieDB";
import { WebSocketManager } from "../../../data/utils/WebSocketManager";
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
