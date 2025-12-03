import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";
import { useCases } from "../../adapters/di/container";

const getMovieById = useCases.getMoviebyId();
const updateMovieUseCase = useCases.updateMovie();
const getVideoById = useCases.getVideoById();
const getSeriesById = useCases.getSeriesById();
const getSeasonById = useCases.getSeasonById();
const getEpisodeById = useCases.getEpisodeById();
const updateVideo = useCases.updateVideo();
const updateSeason = useCases.updateSeason();
const updateSeries = useCases.updateSeries();
const getVideoByEpisodeId = useCases.getVideoByEpisodeId();
const addVideoToContinueWatching = useCases.addVideoToContinueWatching();
const removeVideoFromContinueWatching =
  useCases.removeVideoFromContinueWatching();
const addMovieToWatchList = useCases.addMovieToWatchList();
const removeMovieFromWatchList = useCases.removeMovieFromWatchList();
const addVideoToWatchList = useCases.addVideoToWatchList();
const removeVideoFromWatchList = useCases.removeVideoFromWatchList();
const addSeasonToWatchList = useCases.addSeasonToWatchList();
const removeSeasonFromWatchList = useCases.removeSeasonFromWatchList();
const addSeriesToWatchList = useCases.addSeriesToWatchList();
const removeSeriesFromWatchList = useCases.removeSeriesFromWatchList();
const setEpisodeWatchState = useCases.setEpisodeWatchState();

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

    const movie = await getMovieById.execute(movieId);

    if (!movie) {
      return next(new ApiError(404, messages.errors.notFound.movie));
    }

    if (watched) {
      await addMovieToWatchList.execute(movieId, userId);
    } else {
      await removeMovieFromWatchList.execute(movieId, userId);
    }
    await updateMovieUseCase.execute(movie.id, movie);

    // Manage continue watching for all movie videos
    for (const video of movie.videos) {
      if (
        watched === false &&
        video.watchLists.filter((wl) => wl.id === userId).length > 0 &&
        (video.watchLists.filter((wl) => wl.id === userId)[0]?.timeWatched ??
          0) > 0
      ) {
        await addVideoToContinueWatching.execute(video.id, userId);
      } else if (watched === true) {
        await removeVideoFromContinueWatching.execute(video.id, userId);
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

    const video = await getVideoById.execute(videoId);

    if (!video) {
      return next(new ApiError(404, messages.errors.notFound.video));
    }

    if (watched) {
      await addVideoToWatchList.execute(videoId, userId);
    } else {
      await removeVideoFromWatchList.execute(videoId, userId);
    }
    await updateVideo.execute(video.id, video);

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

    const series = await getSeriesById.execute(seriesId);

    if (!series) {
      return next(new ApiError(404, messages.errors.notFound.series));
    }

    for (const season of series.seasons) {
      const seasonWithEpisodes = await getSeasonById.execute(season.id);

      if (!seasonWithEpisodes) continue;

      for (const episode of seasonWithEpisodes.episodes) {
        const episodeDB = await getEpisodeById.execute(episode.id);

        if (!episodeDB) continue;

        const video = await getVideoByEpisodeId.execute(episodeDB.id);

        if (!video) continue;

        if (watched) {
          await addVideoToWatchList.execute(video.id, userId);
        } else {
          await removeVideoFromWatchList.execute(video.id, userId);
        }
        await updateVideo.execute(video.id, video);

        // Manage continue watching
        if (watched === true) {
          await removeVideoFromContinueWatching.execute(video.id, userId);
        }
      }

      if (watched) {
        await addSeasonToWatchList.execute(seasonWithEpisodes.id, userId);
      } else {
        await removeSeasonFromWatchList.execute(seasonWithEpisodes.id, userId);
      }
      await updateSeason.execute(seasonWithEpisodes.id, seasonWithEpisodes);
    }

    if (watched) {
      await addSeriesToWatchList.execute(seriesId, userId);
    } else {
      await removeSeriesFromWatchList.execute(seriesId, userId);
    }
    await updateSeries.execute(series.id, series);

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

    const season = await getSeasonById.execute(seasonId);

    if (!season) {
      return next(new ApiError(404, messages.errors.notFound.season));
    }

    // Get first or last episode
    const episodeIndex = watched === true ? season.episodes.length - 1 : 0;
    const episode = season.episodes.sort(
      (a, b) => a.episodeNumber - b.episodeNumber
    )[episodeIndex];

    // Set episode watched state
    await setEpisodeWatchState.execute(episode.id, userId, watched);
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

    const episode = await getEpisodeById.execute(episodeId);

    if (!episode) {
      return next(new ApiError(404, messages.errors.notFound.episode));
    }

    const season = await getSeasonById.execute(episode.seasonId);

    if (!season) {
      return next(new ApiError(404, messages.errors.notFound.season));
    }

    await setEpisodeWatchState.execute(episode.id, userId, watched);

    return res.status(200).json({ message: messages.success.update });
  })
);

export default router;
