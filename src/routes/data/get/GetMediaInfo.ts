import { messages } from "@/config/messages";
import { MediaManager } from "@/managers/MediaManager";
import ApiError from "@/utils/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";

const router = express.Router();

/**
 * @route GET /videoInfo
 * @desc Gets formatted metadata for a given video ID.
 */
router.get(
  "/videoInfo",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    const videoInfo = await MediaManager.getFormattedVideoInfo(id);

    res.status(200).json(videoInfo);
  })
);

/**
 * @route GET /remaining-episodes
 * @desc Counts unwatched episodes for a given series and user.
 */
router.get(
  "/remaining-episodes",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { seriesId } = req.query;
    const userId = (req as any).user?.id; // Assuming user is attached by auth middleware

    if (typeof seriesId !== "string" || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const remainingEpisodes = await MediaManager.countRemainingEpisodes(
      seriesId,
      userId
    );

    res.status(200).json(remainingEpisodes);
  })
);

/**
 * @route GET /remaining-videos
 * @desc Counts unwatched videos for a given movie and user.
 */
router.get(
  "/remaining-videos",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { movieId } = req.query;
    const userId = (req as any).user?.id; // Assuming user is attached by auth middleware

    if (typeof movieId !== "string" || !userId) {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const remainingVideos = await MediaManager.countRemainingVideos(
      movieId,
      userId
    );

    res.status(200).json(remainingVideos);
  })
);

/**
 * @route GET /isShowInMyList
 * @desc Checks if a series is in the user's list.
 */
router.get(
  "/isShowInMyList",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { seriesId, userId } = req.query;
    if (typeof seriesId !== "string" || typeof userId !== "string") {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const isInMyList = await MediaManager.isSeriesInMyList(seriesId, userId);

    res.status(200).json(isInMyList);
  })
);

/**
 * @route GET /isMovieInMyList
 * @desc Checks if a movie is in the user's list.
 */
router.get(
  "/isMovieInMyList",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { movieId, userId } = req.query;
    if (typeof movieId !== "string" || typeof userId !== "string") {
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );
    }

    const isInMyList = await MediaManager.isMovieInMyList(movieId, userId);

    res.status(200).json(isInMyList);
  })
);

export default router;
