import { artistsRepo } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { AddArtistUseCase } from "../../../application/usecases/AddArtistUseCase";
import { DeleteArtistUseCase } from "../../../application/usecases/DeleteArtistUseCase";
import { GetArtistByIdUseCase } from "../../../application/usecases/GetArtistByIdUseCase";
import { UpdateArtistUseCase } from "../../../application/usecases/UpdateArtistUseCase";

export class ArtistsController {
  /**
   * @swagger
   * /artists:
   *   post:
   *     summary: Create a new artist
   *     tags: [Artists]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *             properties:
   *               name:
   *                 type: string
   *                 description: Artist name
   *                 example: "The Beatles"
   *     responses:
   *       201:
   *         description: Artist created successfully
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
   *                   example: Artist created successfully
   *                 data:
   *                   $ref: '#/components/schemas/Artist'
   *       400:
   *         description: Missing required parameters
   *       409:
   *         description: Artist already exists
   *       500:
   *         description: Creation failed
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;

      if (!name) {
        return next(
          new ApiError(400, messages.errors.validation.notEnoughParams)
        );
      }

      const useCase = new AddArtistUseCase(artistsRepo);
      const result = await useCase.execute({ name });

      if (!result) {
        return next(new ApiError(409, "Artist already exists"));
      }

      res.status(201).json({
        status: "success",
        message: messages.success.create,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /artists/{id}:
   *   get:
   *     summary: Get artist by ID
   *     tags: [Artists]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Artist ID
   *     responses:
   *       200:
   *         description: Artist retrieved successfully
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
   *                   example: Artist retrieved successfully
   *                 data:
   *                   $ref: '#/components/schemas/Artist'
   *       400:
   *         description: Invalid artist ID
   *       404:
   *         description: Artist not found
   *       500:
   *         description: Retrieval failed
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new GetArtistByIdUseCase(artistsRepo);
      const result = await useCase.execute(id);

      if (!result) {
        return next(new ApiError(404, "Artist not found"));
      }

      res.status(200).json({
        status: "success",
        message: "Artist retrieved successfully",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
  /**
   * @swagger
   * /artists/{id}:
   *   put:
   *     summary: Update an artist
   *     tags: [Artists]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Artist ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Artist name
   *     responses:
   *       200:
   *         description: Artist updated successfully
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
   *                   example: Artist updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Artist'
   *       400:
   *         description: Invalid artist ID
   *       500:
   *         description: Update failed
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateArtistUseCase(artistsRepo);
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
   * /artists/{id}:
   *   delete:
   *     summary: Delete an artist
   *     tags: [Artists]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Artist ID
   *     responses:
   *       200:
   *         description: Artist deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Artist deleted successfully
   *       400:
   *         description: Invalid artist ID
   *       500:
   *         description: Deletion failed
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new DeleteArtistUseCase(artistsRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }
}
