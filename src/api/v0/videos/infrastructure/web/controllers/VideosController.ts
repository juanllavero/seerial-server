import {
  librariesRepo,
  videosRepo,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteVideoUseCase } from "../../../application/usecases/DeleteVideoUseCase";
import { UpdateMediaInfoUseCase } from "../../../application/usecases/UpdateMediaInfoUseCase";
import { UpdateVideoUseCase } from "../../../application/usecases/UpdateVideosUseCase";

export class VideosController {
  /**
   * @swagger
   * /videos/{id}:
   *   put:
   *     summary: Update a video
   *     tags: [Videos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Video ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 description: Video title
   *               duration:
   *                 type: number
   *                 description: Video duration in seconds
   *               filePath:
   *                 type: string
   *                 description: File path
   *               quality:
   *                 type: string
   *                 description: Video quality
   *               size:
   *                 type: number
   *                 description: File size in bytes
   *     responses:
   *       200:
   *         description: Video updated successfully
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
   *                   example: Video updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Video'
   *       400:
   *         description: Invalid video ID
   *       500:
   *         description: Update failed
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateVideoUseCase(videosRepo);
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
   * /videos/{id}:
   *   delete:
   *     summary: Delete a video
   *     tags: [Videos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Video ID
   *     responses:
   *       200:
   *         description: Video deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Video deleted successfully
   *       400:
   *         description: Invalid video ID
   *       500:
   *         description: Deletion failed
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new DeleteVideoUseCase(videosRepo, librariesRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /videos/{id}/media-info:
   *   put:
   *     summary: Update video media information
   *     tags: [Videos]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Video ID
   *     responses:
   *       200:
   *         description: Media info updated successfully
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
   *                   example: Media info updated successfully
   *                 data:
   *                   type: object
   *                   description: Updated media information
   *       400:
   *         description: Invalid video ID
   *       500:
   *         description: Media info update failed
   */
  static async updateMediaInfo(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateMediaInfoUseCase(videosRepo);
      const result = await useCase.execute(id);

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
