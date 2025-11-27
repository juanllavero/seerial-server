import { getUserId } from "@/utils/utils";
import { NextFunction, Request, Response } from "express";
import { MyListRepositoryImpl } from "../../persistence/repositories/MyListRepositoryImpl";

const myListRepo = new MyListRepositoryImpl();

export class MyListController {
  static async getMyListMovies(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const series = myListRepo.getMoviesFromMyList(getUserId(req));

      res.status(200).json(series);
    } catch (err) {
      next(err);
    }
  }

  static async getMyListSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const movies = myListRepo.getSeriesFromMyList(getUserId(req));
    res.status(200).json(movies);
  }
}
