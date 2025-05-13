import express from "express";
import {
  deleteCollection,
  deleteEpisode,
  deleteLibrary,
  deleteSeason,
  deleteSeries,
} from "../../db/delete/deleteData";
const router = express.Router();

// Delete Library
router.delete("/libraries/:id", (req, res) => {
  const { id } = req.params;

  try {
    deleteLibrary(id);
    res.status(200).json({ message: "Library deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete library" });
  }
});

// Delete Show
router.delete("/series/:id", (req, res) => {
  const { id } = req.params;

  try {
    deleteSeries(id);
    res.status(200).json({ message: "Show deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete show" });
  }
});

// Delete Season
router.delete("/season/:id", (req, res) => {
  const { id } = req.params;

  try {
    deleteSeason(id);
    res.status(200).json({ message: "Season deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete season" });
  }
});

// Delete Episode
router.delete("/episode/:id", (req, res) => {
  const { id } = req.params;

  try {
    deleteEpisode(id);
    res.status(200).json({ message: "Episode deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete episode" });
  }
});

// Delete collection
router.delete("/collection/:id", (req, res) => {
  const { id } = req.params;

  try {
    deleteCollection(id);
    res.status(200).json({ message: "Collection deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete collection" });
  }
});

export default router;
