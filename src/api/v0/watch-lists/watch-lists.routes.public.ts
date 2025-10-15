import { addVideoToContinueWatching } from "@/api/v0/continue-watching/continue-watching.service";
import { setEpisodeWatchState } from "@/api/v0/episodes/episodes.controller";
import { getEpisodeById } from "@/api/v0/episodes/episodes.service";
import { getMovieById } from "@/api/v0/movies/movies.service";
import { getSeasonById } from "@/api/v0/seasons/seasons.service";
import { getVideoById } from "@/api/v0/videos/videos.service";
import {
  addMovieToWatchList,
  addVideoToWatchList,
  getWatchListByVideoId,
  removeMovieFromWatchList,
  removeVideoFromWatchList,
  updateWatchList,
} from "@/api/v0/watch-lists/watch-lists.service";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";

const router = express.Router();

router.put(
  "/updateWatchState",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { videoId, timeWatched, watched, userId } = req.body;

    if (videoId == null || timeWatched == null || watched == null || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const video = await getVideoById(videoId);

    if (!video) {
      return next(new ApiError(400, messages.errors.notFound.video));
    }

    if (video.episodeId) {
      const episode = await getEpisodeById(video.episodeId);

      if (!episode) {
        return next(new ApiError(400, messages.errors.notFound.episode));
      }

      const season = await getSeasonById(episode.seasonId);

      if (!season) {
        return next(new ApiError(400, messages.errors.notFound.season));
      }

      await setEpisodeWatchState(season, episode, watched, userId);
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
  })
);

export default router;
