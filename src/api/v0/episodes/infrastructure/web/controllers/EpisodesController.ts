import {
  continueWatchingRepo,
  episodesRepo,
  seasonsRepo,
  seriesRepo,
  videosRepo,
  watchListRepo,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteEpisodeUseCase } from "../../../application/usecases/DeleteEpisodeUseCase";
import { SetEpisodeWatchStateUseCase } from "../../../application/usecases/SetEpisodeWatchStateUseCase";
import { UpdateEpisodeUseCase } from "../../../application/usecases/UpdateEpisodeUseCase";

export class EpisodesController {
  /**
   * @swagger
   * /episodes/{id}:
   *   put:
   *     summary: Update an episode
   *     tags: [Episodes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Episode ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 description: Episode title
   *               episodeNumber:
   *                 type: integer
   *                 description: Episode number in season
   *               description:
   *                 type: string
   *                 description: Episode description
   *               airDate:
   *                 type: string
   *                 format: date
   *                 description: Original air date
   *               duration:
   *                 type: integer
   *                 description: Episode duration in minutes
   *     responses:
   *       200:
   *         description: Episode updated successfully
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
   *                   example: Episode updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Episode'
   *       400:
   *         description: Invalid episode ID or data
   *       500:
   *         description: Update failed
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateEpisodeUseCase(episodesRepo);
      const result = await useCase.execute(id, req.body);

      res.status(200).json({
        status: "success",
        message: messages.success.update,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /episodes/{id}:
   *   delete:
   *     summary: Delete an episode
   *     tags: [Episodes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Episode ID
   *     responses:
   *       200:
   *         description: Episode deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Episode deleted successfully
   *       400:
   *         description: Invalid episode ID
   *       500:
   *         description: Deletion failed
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new DeleteEpisodeUseCase(episodesRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /episodes/{id}/watch-state:
   *   put:
   *     summary: Set episode watch state for a user
   *     tags: [Episodes]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Episode ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - state
   *             properties:
   *               state:
   *                 type: boolean
   *                 description: Whether the episode is watched (true) or unwatched (false)
   *     responses:
   *       200:
   *         description: Episode watch state updated successfully
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
   *                   example: "Episode watch state updated to true"
   *       400:
   *         description: Invalid episode ID or watch state
   *       401:
   *         description: Unauthorized - user not authenticated
   *       500:
   *         description: Watch state update failed
   */
  static async setWatchState(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { state } = req.body;
      const userId = (req as any).user?.id;

      if (!id) throw new ApiError(400, messages.errors.validation.missingId);
      if (typeof state !== "boolean") {
        throw new ApiError(400, messages.errors.validation.invalidData);
      }
      if (!userId) throw new ApiError(401, messages.errors.token.missing);

      const useCase = new SetEpisodeWatchStateUseCase(
        episodesRepo,
        seasonsRepo,
        seriesRepo,
        videosRepo,
        watchListRepo,
        continueWatchingRepo
      );

      await useCase.execute(id, userId, state);

      res.status(200).json({
        status: "success",
        message: `Episode watch state updated to ${state}`,
      });
    } catch (err) {
      next(err);
    }
  }
}
