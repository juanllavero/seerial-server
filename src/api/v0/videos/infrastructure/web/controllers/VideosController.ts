import {
  librariesRepo,
  videosRepo,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { MediaManager } from "@/managers/MediaManager";
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

  /**
   * @swagger
   * /videos/{id}/media-info:
   *   get:
   *     summary: Get formatted video information
   *     tags: [Media Info]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Video ID
   *     responses:
   *       200:
   *         description: Formatted video information
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 duration:
   *                   type: number
   *                   description: Video duration in seconds
   *                 resolution:
   *                   type: string
   *                   description: Video resolution (e.g., "1920x1080")
   *                 bitrate:
   *                   type: number
   *                   description: Video bitrate
   *                 codec:
   *                   type: string
   *                   description: Video codec
   *                 size:
   *                   type: number
   *                   description: File size in bytes
   *                 format:
   *                   type: string
   *                   description: Video format/container
   *       400:
   *         description: Invalid video ID
   *       500:
   *         description: Media info retrieval failed
   */
  static async getVideoInfo(req: Request, res: Response, next: NextFunction) {
    const { id } = req.query;
    if (typeof id !== "string") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    const videoInfo = await MediaManager.getFormattedVideoInfo(id);

    res.status(200).json(videoInfo);
  }
}
