import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { ExternalSearchManager } from "@/managers/ExternalSearchManager";
import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import { MediaManager } from "@/managers/MediaManager";
import catchAsync from "@/utils/catchAsync";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();

router.get(
  "/details/:type",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { type } = req.params;
    const { id } = req.query;
    if (typeof id !== "string")
      return next(new ApiError(400, "Query parameter 'id' is required."));
    const details = await MediaDetailsManager.getDetails(type, id);
    res.status(200).json(details);
  })
);

router.get(
  "/:itemType/:mediaType",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { itemType, mediaType } = req.params;
    const { id } = req.query;

    if (!["movie", "series", "season"].includes(itemType)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }
    if (!["video", "music"].includes(mediaType)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    if (typeof id !== "string")
      return next(
        new ApiError(400, messages.errors.validation.notEnoughParams)
      );

    const url = await MediaDetailsManager.findMediaBackground(
      mediaType as "video" | "music",
      itemType as "movie" | "series" | "season",
      id
    );

    res.status(200).json(url);
  })
);

router.get(
  "/movies/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, year } = req.query;
    if (typeof name !== "string") {
      return next(new ApiError(400, "Query parameter 'name' is required."));
    }
    const results = await ExternalSearchManager.searchMovies(
      name,
      year as string | undefined
    );
    res.status(200).json(results);
  })
);

router.get(
  "/shows/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, year } = req.query;
    if (typeof name !== "string") {
      return next(new ApiError(400, "Query parameter 'name' is required."));
    }
    const results = await ExternalSearchManager.searchTvShows(
      name,
      year as string | undefined
    );
    res.status(200).json(results);
  })
);

router.get(
  "/episodeGroups/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, "Query parameter 'id' is required."));
    }
    const results = await ExternalSearchManager.searchEpisodeGroups(id);
    res.status(200).json(results);
  })
);

router.get(
  "/imdbScore",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, "Query parameter 'id' is required."));
    }
    const score = await ExternalSearchManager.getImdbScore(id);
    res.status(200).json(score);
  })
);

router.get(
  "/media/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { query } = req.query;
    if (typeof query !== "string") {
      return next(new ApiError(400, "Query parameter 'query' is required."));
    }
    const results = await ExternalSearchManager.searchDownloadableMedia(query);
    res.status(200).json(results);
  })
);

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
