import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";

export class WatchListController {
  /**
   * @swagger
   * /watch-lists/update-state:
   *   post:
   *     summary: Update watch state for a video
   *     tags: [Watch Lists]
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
   *               - timeWatched
   *               - watched
   *               - userId
   *             properties:
   *               videoId:
   *                 type: string
   *                 description: Video ID
   *               timeWatched:
   *                 type: number
   *                 description: Time watched in seconds
   *               watched:
   *                 type: boolean
   *                 description: Whether the video is fully watched
   *               userId:
   *                 type: string
   *                 description: User ID
   *     responses:
   *       200:
   *         description: Watch state updated successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 message:
   *                   type: string
   *                   example: Watch state updated successfully
   *                 data:
   *                   type: object
   *                   description: Updated watch state information
   *       400:
   *         description: Missing required parameters
   *       500:
   *         description: Update failed
   */
  static async updateWatchState(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { videoId, timeWatched, watched, userId } = req.body;
      if (videoId == null || timeWatched == null || watched == null || !userId)
        throw new ApiError(400, messages.errors.validation.notEnoughParams);

      const updateWatchState = useCases.updateWatchStateUseCase();
      const result = await updateWatchState.execute({
        videoId,
        timeWatched,
        watched,
        userId,
      });

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
