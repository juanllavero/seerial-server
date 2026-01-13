import { songsRepo } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { DeleteSongUseCase } from "../../../application/usecases/DeleteSongUseCase";
import { UpdateSongUseCase } from "../../../application/usecases/UpdateSongUseCase";

export class SongsController {
  /**
   * @swagger
   * /songs/{id}:
   *   put:
   *     summary: Update a song
   *     tags: [Songs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Song ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               title:
   *                 type: string
   *                 description: Song title
   *               artist:
   *                 type: string
   *                 description: Artist name
   *               album:
   *                 type: string
   *                 description: Album name
   *               duration:
   *                 type: number
   *                 description: Duration in seconds
   *               genre:
   *                 type: string
   *                 description: Music genre
   *               filePath:
   *                 type: string
   *                 description: File path
   *     responses:
   *       200:
   *         description: Song updated successfully
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
   *                   example: Song updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Song'
   *       400:
   *         description: Invalid song ID
   *       500:
   *         description: Update failed
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateSongUseCase(songsRepo);
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
   * /songs/{id}:
   *   delete:
   *     summary: Delete a song
   *     tags: [Songs]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Song ID
   *     responses:
   *       200:
   *         description: Song deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Song deleted successfully
   *       400:
   *         description: Invalid song ID
   *       500:
   *         description: Deletion failed
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new DeleteSongUseCase(songsRepo);
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }
}
