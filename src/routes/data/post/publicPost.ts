import {
  addMovieToMyList,
  addSeriesToMyList,
  getMovieFromMyList,
  getSeriesFromMyList,
  removeMovieFromMyList,
  removeSeriesFromMyList,
} from "@/api/v0/my-lists/my-lists.service";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();

// Set movie watched state
router.post(
  "/setMovieWatched",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { movieId, watched, userId } = req.body;

    if (!movieId || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const movie = await getMovieById(movieId);

    if (!movie) {
      return next(new ApiError(404, messages.errors.notFound.movie));
    }

    if (watched) {
      await addMovieToWatchList(movieId, userId);
    } else {
      await removeMovieFromWatchList(movieId, userId);
    }
    await movie.save();

    // Manage continue watching for all movie videos
    for (const video of movie.videos) {
      if (
        watched === false &&
        video.watchLists.filter((wl) => wl.id === userId).length > 0 &&
        (video.watchLists.filter((wl) => wl.id === userId)[0]?.timeWatched ??
          0) > 0
      ) {
        await addVideoToContinueWatching(video.id, userId);
      } else if (watched === true) {
        await removeVideoFromContinueWatching(video.id, userId);
      }
    }

    return res.status(200).json({ message: messages.success.update });
  })
);

// Set video watched state
router.post(
  "/setVideoWatched",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { videoId, watched, userId } = req.body;

    if (!videoId || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const video = await getVideoById(videoId);

    if (!video) {
      return next(new ApiError(404, messages.errors.notFound.video));
    }

    if (watched) {
      await addVideoToWatchList(videoId, userId);
    } else {
      await removeVideoFromWatchList(videoId, userId);
    }
    await video.save();

    return res.status(200).json({ message: messages.success.update });
  })
);

// Set show watched state
router.post(
  "/setSeriesWatched",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { seriesId, watched, userId } = req.body;

    if (!seriesId || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const series = await getSeriesById(seriesId);

    if (!series) {
      return next(new ApiError(404, messages.errors.notFound.series));
    }

    for (const season of series.seasons) {
      const seasonWithEpisodes = await getSeasonById(season.id);

      if (!seasonWithEpisodes) continue;

      for (const episode of seasonWithEpisodes.episodes) {
        const episodeDB = await getEpisodeById(episode.id);

        if (!episodeDB) continue;

        const video = await getVideoByEpisodeId(episodeDB.id);

        if (!video) continue;

        if (watched) {
          await addVideoToWatchList(video.id, userId);
        } else {
          await removeVideoFromWatchList(video.id, userId);
        }
        await video.save();

        // Manage continue watching
        if (watched === true) {
          await removeVideoFromContinueWatching(video.id, userId);
        }
      }

      if (watched) {
        await addSeasonToWatchList(seasonWithEpisodes.id, userId);
      } else {
        await removeSeasonFromWatchList(seasonWithEpisodes.id, userId);
      }
      await seasonWithEpisodes.save();
    }

    if (watched) {
      await addSeriesToWatchList(seriesId, userId);
    } else {
      await removeSeriesFromWatchList(seriesId, userId);
    }
    await series.save();

    return res.status(200).json({ message: messages.success.update });
  })
);

// Set season watched state
router.post(
  "/setSeasonWatched",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { seasonId, watched, userId } = req.body;

    if (!userId || !seasonId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const season = await getSeasonById(seasonId);

    if (!season) {
      return next(new ApiError(404, messages.errors.notFound.season));
    }

    // Get first or last episode
    const episodeIndex = watched === true ? season.episodes.length - 1 : 0;
    const episode = season.episodes.sort(
      (a, b) => a.episodeNumber - b.episodeNumber
    )[episodeIndex];

    // Set episode watched state
    await setEpisodeWatchState(season, episode, watched, userId);
    return res.status(200).json({ message: messages.success.update });
  })
);

// Set episode watched state
router.post(
  "/setEpisodeWatched",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { episodeId, watched, userId } = req.body;

    if (!userId || !episodeId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const episode = await getEpisodeById(episodeId);

    if (!episode) {
      return next(new ApiError(404, messages.errors.notFound.episode));
    }

    const season = await getSeasonById(episode.seasonId);

    if (!season) {
      return next(new ApiError(404, messages.errors.notFound.season));
    }

    await setEpisodeWatchState(season, episode, watched, userId);

    return res.status(200).json({ message: messages.success.update });
  })
);

// Add/remove series from My List
router.post(
  "/updateSeriesMyList",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { seriesId, userId } = req.body;

    if (!userId || !seriesId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    if (await getSeriesFromMyList(seriesId, userId)) {
      await removeSeriesFromMyList(seriesId, userId);
    } else {
      await addSeriesToMyList(seriesId, userId);
    }

    return res.status(200).json({ message: messages.success.update });
  })
);

// Add/remove movie from My List
router.post(
  "/updateMovieMyList",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { movieId, userId } = req.body;

    if (!userId || !movieId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    if (await getMovieFromMyList(movieId, userId)) {
      await removeMovieFromMyList(movieId, userId);
    } else {
      await addMovieToMyList(movieId, userId);
    }

    return res.status(200).json({ message: messages.success.update });
  })
);

export default router;
