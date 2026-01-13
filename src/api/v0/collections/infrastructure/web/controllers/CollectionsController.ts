import { collectionsRepo } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { ReorderItemDTO } from "../../../application/dtos/CollectionDTOs";
import { DeleteCollectionUseCase } from "../../../application/usecases/DeleteCollectionUseCase";
import { GetMusicExtrasUseCase } from "../../../application/usecases/GetMusicExtrasUseCase";
import { ReorderCollectionItemsUseCase } from "../../../application/usecases/ReorderCollectionItemsUseCase";
import { UpdateCollectionUseCase } from "../../../application/usecases/UpdateCollectionUseCase";

export class CollectionsController {
  /**
   * @swagger
   * /collections/{collectionId}/music-extras:
   *   get:
   *     summary: Get music extras for a collection
   *     tags: [Collections]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: collectionId
   *         required: true
   *         schema:
   *           type: string
   *         description: Collection ID
   *     responses:
   *       200:
   *         description: Music extras retrieved successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               description: Music extras data
   *       400:
   *         description: Missing collection ID
   *       500:
   *         description: Failed to retrieve music extras
   */
  static async getMusicExtras(req: Request, res: Response, next: NextFunction) {
    const { collectionId } = req.params;

    if (!collectionId) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const extras = new GetMusicExtrasUseCase(collectionsRepo).execute(
      collectionId
    );
    res.status(200).json(extras);
  }

  /**
   * @swagger
   * /collections/reorder-content:
   *   put:
   *     summary: Reorder items in a collection
   *     tags: [Collections]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - collectionId
   *               - orderedItems
   *             properties:
   *               collectionId:
   *                 type: string
   *                 description: Collection ID
   *               orderedItems:
   *                 type: array
   *                 items:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: string
   *                       description: Item ID
   *                     order:
   *                       type: number
   *                       description: New order position
   *     responses:
   *       200:
   *         description: Collection items reordered successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Items reordered successfully
   *       400:
   *         description: Invalid data or missing parameters
   *       500:
   *         description: Reorder operation failed
   */
  static async reorderContent(req: Request, res: Response, next: NextFunction) {
    const { collectionId, orderedItems } = req.body;

    if (!collectionId || !Array.isArray(orderedItems)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    const useCase = new ReorderCollectionItemsUseCase(collectionsRepo);
    await useCase.execute(collectionId, orderedItems as ReorderItemDTO[]);

    res.status(200).json({ message: messages.success.order });
  }

  /**
   * @swagger
   * /collections/{id}:
   *   put:
   *     summary: Update a collection
   *     tags: [Collections]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Collection ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Collection name
   *               description:
   *                 type: string
   *                 description: Collection description
   *               coverImage:
   *                 type: string
   *                 description: Cover image URL
   *               isPublic:
   *                 type: boolean
   *                 description: Whether the collection is public
   *     responses:
   *       200:
   *         description: Collection updated successfully
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
   *                   example: Collection updated successfully
   *                 data:
   *                   $ref: '#/components/schemas/Collection'
   *       400:
   *         description: Invalid collection ID
   *       500:
   *         description: Update failed
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    const updatedCollectionData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const useCase = new UpdateCollectionUseCase(collectionsRepo);
    const updatedCollection = await useCase.execute(id, updatedCollectionData);

    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedCollection,
    });
  }

  /**
   * @swagger
   * /collections/{id}:
   *   delete:
   *     summary: Delete a collection
   *     tags: [Collections]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Collection ID
   *     responses:
   *       200:
   *         description: Collection deleted successfully
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *                   example: Collection deleted successfully
   *       400:
   *         description: Invalid collection ID
   *       404:
   *         description: Collection not found
   *       500:
   *         description: Deletion failed
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const useCase = new DeleteCollectionUseCase(collectionsRepo);
    const deleted = await useCase.execute(id);

    if (!deleted) {
      return next(new ApiError(404, messages.errors.delete));
    }

    res.status(200).json({ message: messages.success.delete });
  }
}
