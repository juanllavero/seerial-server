import express from "express";
import {
  getEpisodeById,
  getMovieById,
  getSeasonById,
  getVideoById,
} from "../../db/get/getData";
import { addVideoToContinueWatching } from "../../db/post/postData";
import {
  updateCollection,
  updateEpisode,
  updateLibrary,
  updateSeason,
  updateSeries,
  updateVideo,
} from "../../db/update/updateData";
import { getMediaInfo } from "../../ffmpeg/mediaInfo";
import { Utils } from "../../utils/Utils";
const router = express.Router();

// Update Library
router.put("/library", (req: any, res: any) => {
  const { libraryId, updatedLibrary } = req.body;

  try {
    updateLibrary(libraryId, updatedLibrary);
    res.status(200).json({ message: "Library updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update library" });
  }
});

// Update Collection
router.put("/collection", (req: any, res: any) => {
  const { collectionId, updatedCollection } = req.body;

  try {
    updateCollection(collectionId, updatedCollection);
    res.status(200).json({ message: "Collection updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update collection" });
  }
});

// Update Show
router.put("/show", (req: any, res: any) => {
  const { showId, updatedShow } = req.body;

  try {
    updateSeries(showId, updatedShow);
    res.status(200).json({ message: "Show updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update show" });
  }
});

// Update Season
router.put("/season", (req: any, res: any) => {
  const { seasonId, updatedSeason } = req.body;

  try {
    updateSeason(seasonId, updatedSeason);
    res.status(200).json({ message: "Season updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update season" });
  }
});

// Update Episode
router.put("/episode", (req: any, res: any) => {
  const { episodeId, updatedEpisode } = req.body;

  try {
    updateEpisode(episodeId, updatedEpisode);
    res.status(200).json({ message: "Episode updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update episode" });
  }
});

// Update Video
router.put("/video", (req: any, res: any) => {
  const { videoId, updatedVideo } = req.body;

  try {
    updateVideo(videoId, updatedVideo);
    res.status(200).json({ message: "Video updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update video" });
  }
});

// Update Movie
router.put("/movie", (req: any, res: any) => {
  const { movieId, updatedMovie } = req.body;

  try {
    updateVideo(movieId, updatedMovie);
    res.status(200).json({ message: "Movie updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update movie" });
  }
});

// Update Album
router.put("/album", (req: any, res: any) => {
  const { albumId, updatedAlbum } = req.body;

  try {
    updateVideo(albumId, updatedAlbum);
    res.status(200).json({ message: "Album updated successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to update album" });
  }
});

// Update Song
router.put("/song", (req: any, res: any) => {
  const { songId, updatedSong } = req.body;

  try {
    updateVideo(songId, updatedSong);
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

  res.json(mediaInfo);
});

router.put("/updateWatchState", async (req: any, res: any) => {
  const { videoId, timeWatched, watched } = req.body;

  if (!videoId || !timeWatched || !watched) {
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

    await Utils.setEpisodeWatchState(season, episode, watched);
  } else if (video.movieId) {
    const movie = await getMovieById(video.movieId);

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    video.watched = watched;
    movie.watched =
      movie.videos.filter((v) => (v.id === video.id ? watched : v.watched))
        .length === movie.videos.length;
    await movie.save();
  }

  video.timeWatched = timeWatched;
  video.lastWatched = new Date().toLocaleString();
  await video.save();

  await addVideoToContinueWatching(videoId);
});

export default router;
