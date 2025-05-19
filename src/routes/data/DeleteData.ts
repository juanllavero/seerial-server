import express from "express";
import {
  deleteAlbum,
  deleteCollection,
  deleteEpisode,
  deleteLibrary,
  deleteMovie,
  deleteSeason,
  deleteSeries,
  deleteSong,
  deleteVideo,
} from "../../db/delete/deleteData";
const router = express.Router();

// Delete Library
router.delete("/libraries/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteLibrary(id);
    res.status(200).json({ message: "Library deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete library" });
  }
});

// Delete Movie
router.delete("/movie/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteMovie(id);
    res.status(200).json({ message: "Movie deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete movie" });
  }
});

// Delete Show
router.delete("/series/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteSeries(id);
    res.status(200).json({ message: "Show deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete show" });
  }
});

// Delete Season
router.delete("/season/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteSeason(id);
    res.status(200).json({ message: "Season deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete season" });
  }
});

// Delete Episode
router.delete("/episode/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteEpisode(id);
    res.status(200).json({ message: "Episode deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete episode" });
  }
});

// Delete Video
router.delete("/video/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteVideo(id);
    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete video" });
  }
});

// Delete collection
router.delete("/collection/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteCollection(id);
    res.status(200).json({ message: "Collection deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete collection" });
  }
});

// Delete album
router.delete("/album/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteAlbum(id);
    res.status(200).json({ message: "Album deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete album" });
  }
});

// Delete song
router.delete("/song/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await deleteSong(id);
    res.status(200).json({ message: "Song deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete song" });
  }
});

export default router;
