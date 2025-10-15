import catchAsync from "@/utils/catchAsync";
import { getUserId } from "@/utils/utils";
import express, { NextFunction, Request, Response } from "express";
import { getMoviesInMyList, getSeriesInMyList } from "./my-lists.service";

const router = express.Router();

router.get(
  "/myListSeries",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const series = await getSeriesInMyList(getUserId(req));
    res.status(200).json(series);
  })
);

router.get(
  "/myListMovies",
  catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
    const movies = await getMoviesInMyList(getUserId(req));
    res.status(200).json(movies);
  })
);

export default router;
