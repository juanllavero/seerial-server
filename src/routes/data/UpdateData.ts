import express from "express";
import { DataManager } from "../../data/utils/DataManager";
import { Utils } from "../../data/utils/Utils";
const router = express.Router();

// Update Library
router.put("/library", (req, res) => {
  const { libraryId, updatedLibrary } = req.body;

  try {
    DataManager.updateLibrary(libraryId, updatedLibrary);
    res.status(200).json({ message: "Library updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update library" });
  }
});

// Update Show
router.put("/show", (req, res) => {
  const { libraryId, showId, updatedShow } = req.body;

  try {
    DataManager.updateShow(libraryId, showId, updatedShow);
    res.status(200).json({ message: "Show updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update show" });
  }
});

// Update Season
router.put("/season", (req, res) => {
  const { libraryId, showId, seasonId, updatedSeason } = req.body;

  try {
    DataManager.updateSeason(libraryId, showId, seasonId, updatedSeason);
    res.status(200).json({ message: "Season updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update season" });
  }
});

// Update Episode
router.put("/episode", (req, res) => {
  const { libraryId, showId, updatedEpisode } = req.body;

  try {
    DataManager.updateEpisode(libraryId, showId, updatedEpisode);
    res.status(200).json({ message: "Episode updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update episode" });
  }
});

// Test endpoint to get media info
router.get("/updateMediaInfo", async (req: any, res: any) => {
  const { libraryId, showId, seasonId, episodeId } = req.body;

  const episode = DataManager.getEpisode(
    libraryId,
    showId,
    seasonId,
    episodeId
  );

  if (!episode) return res.status(404).json({ error: "Episode not found" });

  await Utils.getMediaInfo(episode);

  res.json(episode);
});

export default router;
