import {
  albumsRepo,
  librariesRepo,
  moviesRepo,
  seriesRepo,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { getUserId } from "@/utils/utils";
import { NextFunction, Request, Response } from "express";
import { DeleteLibraryUseCase } from "../../../application/usecases/DeleteLibraryUseCase";
import { GetLibrariesUseCase } from "../../../application/usecases/GetLibrariesUseCase";
import { GetLibraryContentUseCase } from "../../../application/usecases/GetLibraryContentUseCase";
import { GetLibraryUseCase } from "../../../application/usecases/GetLibraryUseCase";
import { ReorderLibrariesUseCase } from "../../../application/usecases/ReorderLibrariesUseCase";
import { ReorderLibraryItemsUseCase } from "../../../application/usecases/ReorderLibraryItemsUseCase";
import { UpdateLibraryUseCase } from "../../../application/usecases/UpdateLibraryUseCase";

export class LibrariesController {
  /**
   * @swagger
   * /libraries:
   *   get:
   *     summary: Get all libraries
   *     tags: [Libraries]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of all libraries
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Library'
   *       500:
   *         description: Internal server error
   */
  static async getAll(_req: Request, res: Response, next: NextFunction) {
    try {
      const useCase = new GetLibrariesUseCase(librariesRepo);
      const libraries = await useCase.execute();
      res.status(200).json({
        status: "success",
        data: libraries,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /libraries/{id}:
   *   get:
   *     summary: Get library by ID
   *     tags: [Libraries]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Library ID
   *     responses:
   *       200:
   *         description: Library details
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   $ref: '#/components/schemas/Library'
   *       400:
   *         description: Missing or invalid ID
   *       404:
   *         description: Library not found
   *       500:
   *         description: Internal server error
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new GetLibraryUseCase(librariesRepo);
      const library = await useCase.execute(id);
      if (!library) {
        throw new ApiError(404, messages.errors.notFound.library);
      }

      res.status(200).json({
        status: "success",
        data: library,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /libraries/{id}/content:
   *   get:
   *     summary: Get library content
   *     tags: [Libraries]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: libraryId
   *         required: true
   *         schema:
   *           type: string
   *         description: Library ID
   *       - in: query
   *         name: type
   *         required: true
   *         schema:
   *           type: string
   *           enum: [movies, series, albums, collections]
   *         description: Content type
   *       - in: query
   *         name: flat
   *         schema:
   *           type: string
   *           enum: [true, false]
   *         description: Return flat structure
   *     responses:
   *       200:
   *         description: Library content
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: array
   *                   items:
   *                     oneOf:
   *                       - $ref: '#/components/schemas/Movie'
   *                       - $ref: '#/components/schemas/Series'
   *                       - $ref: '#/components/schemas/Album'
   *                       - $ref: '#/components/schemas/Collection'
   *       400:
   *         description: Invalid parameters
   *       404:
   *         description: Library not found
   *       500:
   *         description: Internal server error
   */
  static async getContent(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: libraryId } = req.params;
      const { type, flat } = req.query;
      const userId = getUserId(req);
      if (typeof libraryId !== "string" || typeof type !== "string") {
        throw new ApiError(400, messages.errors.validation.invalidData);
      }

      const useCase = new GetLibraryContentUseCase(librariesRepo);
      const library = await useCase.execute(
        libraryId,
        type,
        userId,
        (flat as string) ?? "false"
      );
      if (!library) {
        throw new ApiError(404, messages.errors.notFound.library);
      }

      res.status(200).json({
        status: "success",
        data: library,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /libraries/{id}/scan:
   *   post:
   *     summary: Start library scan
   *     tags: [Libraries]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - libraryId
   *             properties:
   *               libraryId:
   *                 type: string
   *     responses:
   *       200:
   *         description: Scan started successfully
   *       400:
   *         description: Invalid library ID
   *       404:
   *         description: Library not found
   */
  static async startScan(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (typeof id !== "string")
        return next(new ApiError(400, messages.errors.validation.invalidData));

      const library = await useCases.getLibrary().execute(id);

      if (!library) {
        throw new ApiError(404, messages.errors.notFound.library);
      }

      const message = await useCases.scanLibrary().execute(library, false);

      res.status(200).json({
        status: "success",
        message: message,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /libraries/order:
   *   put:
   *     summary: Reorder libraries
   *     tags: [Libraries]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - orderedLibraryIds
   *             properties:
   *               orderedLibraryIds:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Libraries reordered successfully
   *       400:
   *         description: Invalid data
   *       500:
   *         description: Reorder failed
   */
  static async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderedLibraryIds } = req.body;
      if (!orderedLibraryIds)
        throw new ApiError(400, messages.errors.validation.invalidData);

      const useCase = new ReorderLibrariesUseCase(librariesRepo);
      const result = await useCase.execute(req.body);

      if (!result) {
        throw new ApiError(500, messages.errors.order);
      }

      res.status(200).json({
        status: "success",
        message: messages.success.order,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /libraries/{id}/order:
   *   put:
   *     summary: Reorder library items
   *     tags: [Libraries]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - libraryId
   *               - orderedItems
   *             properties:
   *               libraryId:
   *                 type: string
   *               orderedItems:
   *                 type: array
   *                 items:
   *                   type: object
   *     responses:
   *       200:
   *         description: Items reordered successfully
   *       400:
   *         description: Invalid data
   *       500:
   *         description: Reorder failed
   */
  static async reorderItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { id: libraryId } = req.params;
      const { orderedItems } = req.body;

      if (!libraryId || !Array.isArray(orderedItems)) {
        throw new ApiError(400, messages.errors.validation.invalidData);
      }

      const useCase = new ReorderLibraryItemsUseCase(librariesRepo);
      const result = await useCase.execute(libraryId, orderedItems);

      if (!result) {
        throw new ApiError(500, messages.errors.order);
      }

      res.status(200).json({
        status: "success",
        message: messages.success.order,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /libraries:
   *   post:
   *     summary: Create a new library
   *     tags: [Libraries]
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
   *               - path
   *               - type
   *             properties:
   *               name:
   *                 type: string
   *               path:
   *                 type: string
   *               type:
   *                 type: string
   *                 enum: [movies, series, albums, mixed]
   *     responses:
   *       201:
   *         description: Library created successfully
   *       400:
   *         description: Invalid data
   *       500:
   *         description: Creation failed
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const libraryData = req.body;

      const library = await useCases.scanLibrary().execute(libraryData, true);

      if (!library) {
        return next(new ApiError(404, messages.errors.create));
      }

      res.status(201).json({
        status: "success",
        message: messages.success.create,
        data: library,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * @swagger
   * /libraries/{id}:
   *   put:
   *     summary: Update a library
   *     tags: [Libraries]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               path:
   *                 type: string
   *               type:
   *                 type: string
   *     responses:
   *       200:
   *         description: Library updated successfully
   *       400:
   *         description: Invalid ID or data
   *       500:
   *         description: Update failed
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new UpdateLibraryUseCase(librariesRepo);
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
   * /libraries/{id}:
   *   delete:
   *     summary: Delete a library
   *     tags: [Libraries]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Library deleted successfully
   *       400:
   *         description: Invalid ID
   *       500:
   *         description: Deletion failed
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!id) throw new ApiError(400, messages.errors.validation.missingId);

      const useCase = new DeleteLibraryUseCase(
        librariesRepo,
        seriesRepo,
        moviesRepo,
        albumsRepo
      );
      await useCase.execute(id);

      res.status(200).json({ message: messages.success.delete });
    } catch (err) {
      next(err);
    }
  }
}
