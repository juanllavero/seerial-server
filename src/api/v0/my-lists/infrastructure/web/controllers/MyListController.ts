import { myListRepo } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { getUserId } from "@/utils/utils";
import { NextFunction, Request, Response } from "express";

export class MyListController {
  /**
   * @swagger
   * /my-lists/movies:
   *   get:
   *     summary: Get movies from user's personal list
   *     tags: [My Lists]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's movies list retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     description: Movie ID
   *                   title:
   *                     type: string
   *                     description: Movie title
   *                   posterSrc:
   *                     type: string
   *                     description: Movie poster URL
   *                   addedDate:
   *                     type: string
   *                     format: date-time
   *                     description: When the movie was added to the list
   *       401:
   *         description: Unauthorized - invalid or missing authentication
   *       500:
   *         description: Failed to retrieve movies list
   */
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

  /**
   * @swagger
   * /my-lists/series:
   *   get:
   *     summary: Get series from user's personal list
   *     tags: [My Lists]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User's series list retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     description: Series ID
   *                   title:
   *                     type: string
   *                     description: Series title
   *                   posterSrc:
   *                     type: string
   *                     description: Series poster URL
   *                   addedDate:
   *                     type: string
   *                     format: date-time
   *                     description: When the series was added to the list
   *                   totalSeasons:
   *                     type: integer
   *                     description: Total number of seasons
   *                   watchedEpisodes:
   *                     type: integer
   *                     description: Number of episodes watched
   *       401:
   *         description: Unauthorized - invalid or missing authentication
   *       500:
   *         description: Failed to retrieve series list
   */
  static async getMyListSeries(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const movies = myListRepo.getSeriesFromMyList(getUserId(req));
    res.status(200).json(movies);
  }
}
