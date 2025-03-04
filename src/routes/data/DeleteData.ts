import { DataManager } from "../../data/utils/DataManager";
import express from "express";
const router = express.Router();

// Delete Library
router.delete("/libraries/:libraryId", (req, res) => {
  const { libraryId } = req.params;

  console.log(libraryId);

  try {
    DataManager.deleteLibrary(libraryId);
    res.status(200).json({ message: "Library deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete library" });
  }
});

// Delete Show
router.delete("/libraries/:libraryId/shows/:showId", (req, res) => {
  const { libraryId, showId } = req.params;

  try {
    DataManager.deleteShow(libraryId, showId);
    res.status(200).json({ message: "Show deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete show" });
  }
});

// Delete Season
router.delete(
  "/libraries/:libraryId/shows/:showId/seasons/:seasonId",
  (req, res) => {
    const { libraryId, showId, seasonId } = req.params;

    try {
      DataManager.deleteSeason(libraryId, showId, seasonId);
      res.status(200).json({ message: "Season deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete season" });
    }
  }
);

// Delete Episode
router.delete(
  "/libraries/:libraryId/shows/:showId/seasons/:seasonId/episodes/:episodeId",
  (req, res) => {
    const { libraryId, showId, seasonId, episodeId } = req.params;

    try {
      DataManager.deleteEpisode(libraryId, showId, seasonId, episodeId);
      res.status(200).json({ message: "Episode deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete episode" });
    }
  }
);

export default router;
