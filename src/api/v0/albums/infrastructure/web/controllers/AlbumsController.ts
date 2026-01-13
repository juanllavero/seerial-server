import { albumsRepo } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteAlbumUseCase } from "../../../application/usecases/DeleteAlbumUseCase";
import { UpdateAlbumUseCase } from "../../../application/usecases/UpdateAlbumUseCase";

export class AlbumsController {
  /**
   * @swagger
   * /albums/{id}:
   *   put:
   *     summary: Update an album
   *     tags: [Albums]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Album ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 description: Album title
   *               artist:
   *                 type: string
   *                 description: Artist name
   *               releaseDate:
   *                 type: string
   *                 format: date
   *                 description: Release date
   *               genre:
   *                 type: string
   *                 description: Music genre
   *               coverImage:
   *                 type: string
   *                 description: Cover image URL
   *     responses:
   *       200:
   *         description: Album updated successfully
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
   *                   example: Album updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Album'
   *       400:
   *         description: Invalid album ID
   *       500:
   *         description: Update failed
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (!id)
      return next(new ApiError(400, messages.errors.validation.missingId));

    const useCase = new UpdateAlbumUseCase(albumsRepo);
    const result = await useCase.execute(id, req.body);

    res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: result,
    });
  }

  /**
   * @swagger
   * /albums/{id}:
   *   delete:
   *     summary: Delete an album
   *     tags: [Albums]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Album ID
   *     responses:
   *       200:
   *         description: Album deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Album deleted successfully
   *       400:
   *         description: Invalid album ID
   *       500:
   *         description: Deletion failed
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    if (!id)
      return next(new ApiError(400, messages.errors.validation.missingId));

    const useCase = new DeleteAlbumUseCase(albumsRepo);
    await useCase.execute(id);

    res.status(200).json({ message: messages.success.delete });
  }
}
