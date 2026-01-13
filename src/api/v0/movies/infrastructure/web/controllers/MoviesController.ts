import {
  librariesRepo,
  moviesRepo,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteMovieUseCase } from "../../../application/usecases/DeleteMovieUseCase";
import { RefreshMovieMetadataUseCase } from "../../../application/usecases/RefreshMovieMetadataUseCase";
import { UpdateMovieIdUseCase } from "../../../application/usecases/UpdateMovieIdUseCase";
import { UpdateMovieUseCase } from "../../../application/usecases/UpdateMoviesUseCase";

export class MoviesController {
  /**
   * @swagger
   * /movies/refresh-metadata:
   *   post:
   *     summary: Refresh movie metadata from TMDB
   *     tags: [Movies]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - id
   *             properties:
   *               id:
   *                 type: string
   *                 description: Movie ID
   *     responses:
   *       200:
   *         description: Metadata refreshed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Metadata updated successfully
   *       400:
   *         description: Missing movie ID
   *       500:
   *         description: Metadata refresh failed
   */
  static async refreshMovieMetadata(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id } = req.body;
      if (!id)
        throw new ApiError(400, messages.errors.validation.notEnoughParams);

      const useCase = new RefreshMovieMetadataUseCase();
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.update });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /movies/change-identification:
   *   post:
   *     summary: Change movie identification (TMDB ID)
   *     tags: [Movies]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - id
   *               - themdbId
   *             properties:
   *               id:
   *                 type: string
   *                 description: Movie ID
   *               themdbId:
   *                 type: integer
   *                 description: New TMDB ID
   *     responses:
   *       200:
   *         description: Movie identification changed successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Movie updated successfully
   *       400:
   *         description: Missing required parameters
   *       500:
   *         description: Identification change failed
   */
  static async changeIdentification(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { id, themdbId } = req.body;
      if (!id || !themdbId)
        throw new ApiError(400, messages.errors.validation.notEnoughParams);

      const useCase = new UpdateMovieIdUseCase();
      await useCase.execute(id, themdbId);

      res.status(200).json({ message: messages.success.update });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /movies/{id}:
   *   put:
   *     summary: Update a movie
   *     tags: [Movies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Movie ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 description: Movie title
   *               overview:
   *                 type: string
   *                 description: Movie description
   *               releaseDate:
   *                 type: string
   *                 format: date
   *                 description: Release date
   *               genres:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: Movie genres
   *     responses:
   *       200:
   *         description: Movie updated successfully
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
   *                   example: Movie updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Movie'
   *       400:
   *         description: Invalid movie ID
   *       500:
   *         description: Update failed
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateMovieUseCase(moviesRepo);
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
   * /movies/{id}:
   *   delete:
   *     summary: Delete a movie
   *     tags: [Movies]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Movie ID
   *     responses:
   *       200:
   *         description: Movie deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Movie deleted successfully
   *       400:
   *         description: Invalid movie ID
   *       500:
   *         description: Deletion failed
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new DeleteMovieUseCase(librariesRepo, moviesRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }
}
