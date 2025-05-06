import express from 'express';
import {
  updateEpisode,
  updateLibrary,
  updateSeason,
  updateSeries,
} from '../../db/update/updateData';
import { Utils } from '../../utils/Utils';
const router = express.Router();

// Update Library
router.put('/library', (req, res) => {
  const { libraryId, updatedLibrary } = req.body;

  try {
    updateLibrary(libraryId, updatedLibrary);
    res.status(200).json({ message: 'Library updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update library' });
  }
});

// Update Show
router.put('/show', (req, res) => {
  const { showId, updatedShow } = req.body;

  try {
    updateSeries(showId, updatedShow);
    res.status(200).json({ message: 'Show updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update show' });
  }
});

// Update Season
router.put('/season', (req, res) => {
  const { seasonId, updatedSeason } = req.body;

  try {
    updateSeason(seasonId, updatedSeason);
    res.status(200).json({ message: 'Season updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update season' });
  }
});

// Update Episode
router.put('/episode', (req, res) => {
  const { episodeId, updatedEpisode } = req.body;

  try {
    updateEpisode(episodeId, updatedEpisode);
    res.status(200).json({ message: 'Episode updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update episode' });
  }
});

// Test endpoint to get media info
router.put('/updateMediaInfo', async (req: any, res: any) => {
  const { episode } = req.body;

  if (!episode) {
    return res.status(404).json({ error: 'Episode not found' });
  }

  res.json(await Utils.getMediaInfo(episode));
});

export default router;
