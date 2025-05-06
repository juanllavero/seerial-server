import express from 'express';
import { Video } from '../../../data/models/Media/Video.model';
import { getVideoByEpisodeId } from '../../../db/get/getData';
import { Utils } from '../../../utils/Utils';
const router = express.Router();

// Get media info
router.get('/mediaInfo', async (req: any, res: any) => {
  const { libraryId, showId, seasonId, episodeId } = req.query;

  if (
    typeof libraryId !== 'string' ||
    typeof showId !== 'string' ||
    typeof seasonId !== 'string' ||
    typeof episodeId !== 'string'
  ) {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const videoObject = await getVideoByEpisodeId(episodeId);

  if (!videoObject) return;

  const data = await Utils.getMediaInfo(videoObject);
  res.json(data);
});

router.get('/video-info', async (req: any, res: any) => {
  const { path } = req.query;

  if (typeof path !== 'string') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const videoObject = new Video({
    fileSrc: path,
  });

  const data = await Utils.getMediaInfo(videoObject);
  res.json(data);
});

export default router;
