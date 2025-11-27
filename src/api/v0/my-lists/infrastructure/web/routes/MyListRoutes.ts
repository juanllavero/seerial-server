import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import { MyListController } from "../controllers/MyListController";

const router = express.Router();

const isSeriesInMyList = useCases.isSeriesInMyList();
const isMovieInMyList = useCases.isMovieInMyList();
const addSeriesToMyList = useCases.addSeriesToMyList();
const removeSeriesFromMyList = useCases.removeSeriesFromMyList();
const addMovieToMyList = useCases.addMovieToMyList();
const removeMovieFromMyList = useCases.removeMovieFromMyList();

router.get("/my-list/series", catchAsync(MyListController.getMyListSeries));
router.get("/my-list/movies", catchAsync(MyListController.getMyListMovies));

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

    if (await isSeriesInMyList.execute(seriesId, userId)) {
      await removeSeriesFromMyList.execute(seriesId, userId);
    } else {
      await addSeriesToMyList.execute(seriesId, userId);
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

    if (await isMovieInMyList.execute(movieId, userId)) {
      await removeMovieFromMyList.execute(movieId, userId);
    } else {
      await addMovieToMyList.execute(movieId, userId);
    }

    return res.status(200).json({ message: messages.success.update });
  })
);

export default router;
