import express from "express";
import { Episode } from "../../../data/objects/Episode";
import { DataManager } from "../../../data/utils/DataManager";
import { Utils } from "../../../data/utils/Utils";
const router = express.Router();

// Get media info
router.get("/mediaInfo", async (req: any, res: any) => {
  const { libraryId, showId, seasonId, episodeId } = req.query;

  if (
    typeof libraryId !== "string" ||
    typeof showId !== "string" ||
    typeof seasonId !== "string" ||
    typeof episodeId !== "string"
  ) {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const videoObject = DataManager.getEpisode(
    libraryId,
    showId,
    seasonId,
    episodeId
  );

  if (!videoObject) return;

  const data = await Utils.getMediaInfo(videoObject);
  res.json(data);
});

router.get("/video-info", async (req: any, res: any) => {
  const { path } = req.query;

  if (typeof path !== "string") {
    return res.status(400).json({ error: "Invalid parameters" });
  }

  const videoObject = new Episode();

  const data = await Utils.getMediaInfo(videoObject);
  res.json(data);
});

export default router;
