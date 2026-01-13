import { continueWatchingRepo } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { getUserId } from "@/utils/utils";
import { NextFunction, Request, Response } from "express";
import { GetVideosUseCase } from "../../../application/usecases/GetVideosUseCase";

export class ContinueWatchingController {
  /**
   * @swagger
   * /continue-watching/videos:
   *   get:
   *     summary: Get videos from continue watching list
   *     tags: [Continue Watching]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Continue watching videos retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 type: object
   *                 properties:
   *                   id:
   *                     type: string
   *                     description: Video ID
   *                   title:
   *                     type: string
   *                     description: Video title
   *                   duration:
   *                     type: number
   *                     description: Video duration in seconds
   *                   watchedTime:
   *                     type: number
   *                     description: Time watched in seconds
   *                   thumbnail:
   *                     type: string
   *                     description: Video thumbnail URL
   *       401:
   *         description: Unauthorized - invalid or missing authentication
   *       500:
   *         description: Failed to retrieve continue watching videos
   */
  static async getVideos(req: Request, res: Response, _next: NextFunction) {
    const useCase = new GetVideosUseCase(continueWatchingRepo);
    const videos = await useCase.execute(getUserId(req));
    res.status(200).json(videos);
  }
}
