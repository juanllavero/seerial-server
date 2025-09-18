import express from "express";
import {
  getEpisodeById,
  getMovieById,
  getSeasonById,
  getVideoById,
  getWatchListByVideoId,
} from "../../db/get/getData";
import {
  addMovieToWatchList,
  addVideoToContinueWatching,
  addVideoToWatchList,
  removeMovieFromWatchList,
  removeVideoFromWatchList,
} from "../../db/post/postData";
import {
  updateAlbum,
  updateCollection,
  updateEpisode,
  updateLibrary,
  updateMovie,
  updateSeason,
  updateSeries,
  updateVideo,
  updateWatchList,
} from "../../db/update/updateData";
import { getMediaInfo } from "../../ffmpeg/mediaInfo";
import { Utils } from "../../utils/Utils";

const router = express.Router();

// Update Library
router.put("/library/:id", async (req: any, res: any) => {
  const updatedLibrary = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateLibrary(id, updatedLibrary);
    res.status(200).json({ message: "Library updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update library" });
  }
});

// Update Collection
router.put("/collection/:id", async (req: any, res: any) => {
  const updatedCollection = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateCollection(id, updatedCollection);
    res.status(200).json({ message: "Collection updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update collection" });
  }
});

// Update Show
router.put("/show/:id", async (req: any, res: any) => {
  const updatedShow = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateSeries(id, updatedShow);
    res.status(200).json({ message: "Show updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update show" });
  }
});

// Update Season
router.put("/season/:id", async (req: any, res: any) => {
  const updatedSeason = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateSeason(id, updatedSeason);
    res.status(200).json({ message: "Season updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update season" });
  }
});

// Update Episode
router.put("/episode/:id", async (req: any, res: any) => {
  const updatedEpisode = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateEpisode(id, updatedEpisode);
    res.status(200).json({ message: "Episode updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update episode" });
  }
});

// Update Video
router.put("/video:id", async (req: any, res: any) => {
  const updatedVideo = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateVideo(id, updatedVideo);
    res.status(200).json({ message: "Video updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update video" });
  }
});

// Update Movie
router.put("/movie/:id", async (req: any, res: any) => {
  const updatedMovie = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateMovie(id, updatedMovie);
    res.status(200).json({ message: "Movie updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update movie" });
  }
});

// Update Album
router.put("/album/:id", async (req: any, res: any) => {
  const updatedAlbum = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateAlbum(id, updatedAlbum);
    res.status(200).json({ message: "Album updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update album" });
  }
});

// Update Song
router.put("/song/:id", async (req: any, res: any) => {
  const updatedSong = req.body;
  const id = req.params.id;

  if (!id || typeof id !== "string" || id === "") {
    return res.status(400).json({ message: "No ID provided or invalid ID." });
  }

  try {
    await updateVideo(id, updatedSong);
    res.status(200).json({ message: "Song updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update song" });
  }
});

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
      movie.videos.filter((v) => (v.id === video.id ? watched : v.watchList))
        .length === movie.videos.length
    ) {
      await addMovieToWatchList(video.movieId, userId);
    } else {
      await removeMovieFromWatchList(video.movieId, userId);
    }

    await movie.save();

    // Manage continue watching
    await addVideoToContinueWatching(video.id, userId, undefined, movie.id);
  }

  if (watched) {
    await addVideoToWatchList(videoId, userId);
  } else {
    await removeVideoFromWatchList(videoId, userId);
  }

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
