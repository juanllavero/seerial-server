import express from "express";
import {
  getEpisodeById,
  getMovieById,
  getSeasonById,
  getVideoById,
  getWatchListByVideoId,
} from "../../../db/get/getData";
import {
  addMovieToWatchList,
  addVideoToContinueWatching,
  addVideoToWatchList,
  removeMovieFromWatchList,
  removeVideoFromWatchList,
} from "../../../db/post/postData";
import { updateWatchList } from "../../../db/update/updateData";
import { getMediaInfo } from "../../../ffmpeg/mediaInfo";
import { Utils } from "../../../utils/Utils";

const router = express.Router();

// Test endpoint to get media info
router.put("/updateMediaInfo", async (req: any, res: any) => {
  const { videoId } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ error: "Video not found" });
  }

  const mediaInfo = await getMediaInfo(video.fileSrc);

  if (!mediaInfo) {
    return res.status(404).json({ error: "Media info not found" });
  }

  video.mediaInfo = mediaInfo.mediaInfo;
  video.videoTracks = mediaInfo.videoTracks;
  video.subtitleTracks = mediaInfo.subtitleTracks;
  video.audioTracks = mediaInfo.audioTracks;
  video.chapters = mediaInfo.chapters;
  video.runtime = mediaInfo.duration;

  await video.save();

  return res.json(mediaInfo);
});

router.put("/updateWatchState", async (req: any, res: any) => {
  const { videoId, timeWatched, watched, userId } = req.body;

  if (videoId == null || timeWatched == null || watched == null || !userId) {
    return res.status(400).json({ error: "Not enough parameters" });
  }

  const video = await getVideoById(videoId);

  if (!video) {
    return res.status(404).json({ error: "Video not found" });
  }

  if (video.episodeId) {
    const episode = await getEpisodeById(video.episodeId);

    if (!episode) {
      return res.status(404).json({ error: "Episode not found" });
    }

    const season = await getSeasonById(episode.seasonId);

    if (!season) {
      return res.status(404).json({ error: "Season not found" });
    }

    await Utils.setEpisodeWatchState(season, episode, watched, userId);
  } else if (video.movieId) {
    const movie = await getMovieById(video.movieId);
    if (!movie) return res.status(404).json({ error: "Movie not found" });

    if (watched) {
      await addVideoToWatchList(video.id, userId);
    } else {
      await removeVideoFromWatchList(video.id, userId);
    }

    // If all video versions of the movie are watched → mark as watched
    if (
      movie.videos.filter((v) =>
        v.id === video.id
          ? watched
          : v.watchLists.filter((wl) => wl.id === userId).length > 0
      ).length === movie.videos.length
    ) {
      await addMovieToWatchList(video.movieId, userId);
    } else {
      await removeMovieFromWatchList(video.movieId, userId);
    }

    await movie.save();

    // Manage continue watching
    await addVideoToContinueWatching(video.id, userId, undefined, movie.id);
  }

  await addVideoToWatchList(videoId, userId);

  // Update watch list
  const watchList = await getWatchListByVideoId(videoId, userId);
  if (watchList)
    await updateWatchList(watchList.id, {
      timeWatched,
      lastWatched: new Date().toLocaleString(),
    });

  await video.save();
  return res.status(200).json({ message: "Watch state updated" });
});

export default router;
