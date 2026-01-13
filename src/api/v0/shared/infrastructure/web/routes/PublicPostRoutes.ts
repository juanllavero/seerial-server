import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";
import { useCases } from "../../adapters/di/container";

const router = Router();

/**
 * @swagger
 * /setMovieWatched:
 *   post:
 *     summary: Set movie watched state for a user
 *     tags: [Watch States]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - movieId
 *               - watched
 *               - userId
 *             properties:
 *               movieId:
 *                 type: string
 *                 description: Movie ID
 *               watched:
 *                 type: boolean
 *                 description: Whether the movie is watched
 *               userId:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: Movie watch state updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Movie watch state updated successfully"
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Movie not found
 *       500:
 *         description: Watch state update failed
 */
router.post(
  "/setMovieWatched",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { movieId, watched, userId } = req.body;

    if (!movieId || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const movie = await useCases.getMoviebyId().execute(movieId);

    if (!movie) {
      return next(new ApiError(404, messages.errors.notFound.movie));
    }

    if (watched) {
      await useCases.addMovieToWatchList().execute(movieId, userId);
    } else {
      await useCases.removeMovieFromWatchList().execute(movieId, userId);
    }
    await useCases.updateMovie().execute(movie.id, movie);

    // Manage continue watching for all movie videos
    for (const video of movie.videos) {
      if (
        watched === false &&
        video.watchLists.filter((wl) => wl.id === userId).length > 0 &&
        (video.watchLists.filter((wl) => wl.id === userId)[0]?.timeWatched ??
          0) > 0
      ) {
        await useCases.addVideoToContinueWatching().execute(video.id, userId);
      } else if (watched === true) {
        await useCases
          .removeVideoFromContinueWatching()
          .execute(video.id, userId);
      }
    }

    return res.status(200).json({ message: messages.success.update });
  })
);

/**
 * @swagger
 * /setVideoWatched:
 *   post:
 *     summary: Set video watched state for a user
 *     tags: [Watch States]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - videoId
 *               - watched
 *               - userId
 *             properties:
 *               videoId:
 *                 type: string
 *                 description: Video ID
 *               watched:
 *                 type: boolean
 *                 description: Whether the video is watched
 *               userId:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: Video watch state updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Video watch state updated successfully"
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Video not found
 *       500:
 *         description: Watch state update failed
 */
router.post(
  "/setVideoWatched",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { videoId, watched, userId } = req.body;

    if (!videoId || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const video = await useCases.getVideoById().execute(videoId);

    if (!video) {
      return next(new ApiError(404, messages.errors.notFound.video));
    }

    if (watched) {
      await useCases.addVideoToWatchList().execute(videoId, userId);
    } else {
      await useCases.removeVideoFromWatchList().execute(videoId, userId);
    }
    await useCases.updateVideo().execute(video.id, video);

    return res.status(200).json({ message: messages.success.update });
  })
);

/**
 * @swagger
 * /setSeriesWatched:
 *   post:
 *     summary: Set series watched state for a user
 *     tags: [Watch States]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seriesId
 *               - watched
 *               - userId
 *             properties:
 *               seriesId:
 *                 type: string
 *                 description: Series ID
 *               watched:
 *                 type: boolean
 *                 description: Whether the series is watched
 *               userId:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: Series watch state updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Series watch state updated successfully"
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Series not found
 *       500:
 *         description: Watch state update failed
 */
router.post(
  "/setSeriesWatched",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { seriesId, watched, userId } = req.body;

    if (!seriesId || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const series = await useCases.getSeriesById().execute(seriesId);

    if (!series) {
      return next(new ApiError(404, messages.errors.notFound.series));
    }

    for (const season of series.seasons) {
      const seasonWithEpisodes = await useCases
        .getSeasonById()
        .execute(season.id);

      if (!seasonWithEpisodes) continue;

      for (const episode of seasonWithEpisodes.episodes) {
        const episodeDB = await useCases.getEpisodeById().execute(episode.id);

        if (!episodeDB) continue;

        const video = await useCases
          .getVideoByEpisodeId()
          .execute(episodeDB.id);

        if (!video) continue;

        if (watched) {
          await useCases.addVideoToWatchList().execute(video.id, userId);
        } else {
          await useCases.removeVideoFromWatchList().execute(video.id, userId);
        }
        await useCases.updateVideo().execute(video.id, video);

        // Manage continue watching
        if (watched === true) {
          await useCases
            .removeVideoFromContinueWatching()
            .execute(video.id, userId);
        }
      }

      if (watched) {
        await useCases
          .addSeasonToWatchList()
          .execute(seasonWithEpisodes.id, userId);
      } else {
        await useCases
          .removeSeasonFromWatchList()
          .execute(seasonWithEpisodes.id, userId);
      }
      await useCases
        .updateSeason()
        .execute(seasonWithEpisodes.id, seasonWithEpisodes);
    }

    if (watched) {
      await useCases.addSeriesToWatchList().execute(seriesId, userId);
    } else {
      await useCases.removeSeriesFromWatchList().execute(seriesId, userId);
    }
    await useCases.updateSeries().execute(series.id, series);

    return res.status(200).json({ message: messages.success.update });
  })
);

/**
 * @swagger
 * /setSeasonWatched:
 *   post:
 *     summary: Set season watched state for a user
 *     tags: [Watch States]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - seasonId
 *               - watched
 *               - userId
 *             properties:
 *               seasonId:
 *                 type: string
 *                 description: Season ID
 *               watched:
 *                 type: boolean
 *                 description: Whether the season is watched
 *               userId:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: Season watch state updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Season watch state updated successfully"
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Season not found
 *       500:
 *         description: Watch state update failed
 */
router.post(
  "/setSeasonWatched",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { seasonId, watched, userId } = req.body;

    if (!userId || !seasonId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const season = await useCases.getSeasonById().execute(seasonId);

    if (!season) {
      return next(new ApiError(404, messages.errors.notFound.season));
    }

    // Get first or last episode
    const episodeIndex = watched === true ? season.episodes.length - 1 : 0;
    const episode = season.episodes.sort(
      (a, b) => a.episodeNumber - b.episodeNumber
    )[episodeIndex];

    // Set episode watched state
    await useCases.setEpisodeWatchState().execute(episode.id, userId, watched);
    return res.status(200).json({ message: messages.success.update });
  })
);

/**
 * @swagger
 * /setEpisodeWatched:
 *   post:
 *     summary: Set episode watched state for a user
 *     tags: [Watch States]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - episodeId
 *               - watched
 *               - userId
 *             properties:
 *               episodeId:
 *                 type: string
 *                 description: Episode ID
 *               watched:
 *                 type: boolean
 *                 description: Whether the episode is watched
 *               userId:
 *                 type: string
 *                 description: User ID
 *     responses:
 *       200:
 *         description: Episode watch state updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Episode watch state updated successfully"
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Episode or season not found
 *       500:
 *         description: Watch state update failed
 */
router.post(
  "/setEpisodeWatched",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { episodeId, watched, userId } = req.body;

    if (!userId || !episodeId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const episode = await useCases.getEpisodeById().execute(episodeId);

    if (!episode) {
      return next(new ApiError(404, messages.errors.notFound.episode));
    }

    const season = await useCases.getSeasonById().execute(episode.seasonId);

    if (!season) {
      return next(new ApiError(404, messages.errors.notFound.season));
    }

    await useCases.setEpisodeWatchState().execute(episode.id, userId, watched);

    return res.status(200).json({ message: messages.success.update });
  })
);

export default router;
