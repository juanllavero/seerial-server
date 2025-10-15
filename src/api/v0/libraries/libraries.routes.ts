import { Album } from "@/api/v0/albums/albums.model";
import { Movie } from "@/api/v0/movies/movies.model";
import { Series } from "@/api/v0/series/series.model";
import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { scanFiles } from "@/file-search/fileSearch";
import { wsManager } from "@/index";
import { LibraryManager } from "@/managers/LibraryManager";
import { SequelizeManager } from "@/managers/SequelizeManager";
import catchAsync from "@/utils/catchAsync";
import { getUserId } from "@/utils/utils";
import express, { NextFunction, Request, Response } from "express";
import { Library } from "./libraries.model";
import { deleteLibrary, updateLibrary } from "./libraries.service";
import { LibraryCollection } from "./library-collection.model";

const router = express.Router();

router.get(
  "/library",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.query;
    if (typeof id !== "string")
      return next(new ApiError(400, "Query parameter 'id' is required."));
    const library = await LibraryManager.getLibraryById(id);
    res.status(200).json(library);
  })
);

router.get(
  "/libraries",
  catchAsync(async (_req: Request, res: Response, _next: NextFunction) => {
    const libraries = await LibraryManager.getAllLibraries();
    res.status(200).json(libraries);
  })
);

router.get(
  "/library-content",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId, type } = req.query;
    const userId = getUserId(req);
    if (typeof libraryId !== "string" || typeof type !== "string") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }
    const content = await LibraryManager.getLibraryContent(
      libraryId,
      type,
      userId
    );
    res.status(200).json(content);
  })
);

router.get(
  "/library-content-flat",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId, type } = req.query;
    const userId = getUserId(req);
    if (typeof libraryId !== "string" || typeof type !== "string") {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }
    const content = await LibraryManager.getLibraryContent(
      libraryId,
      type,
      userId,
      true
    );
    res.status(200).json(content);
  })
);

router.get(
  "/library/search",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId } = req.query;
    if (typeof libraryId !== "string")
      return next(
        new ApiError(400, "Query parameter 'libraryId' is required.")
      );
    const result = await LibraryManager.startLibraryScan(libraryId);
    res.status(202).json(result);
  })
);

// Add library
router.post(
  "/addLibrary",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const libraryData = req.body;
    const library = await scanFiles(libraryData, wsManager, true);

    if (!library) {
      return next(new ApiError(404, messages.errors.create));
    }

    return res.status(200).json(library);
  })
);

// Reorder libraries
router.post(
  "/libraries/reorder",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { orderedLibraryIds } = req.body;

    if (!Array.isArray(orderedLibraryIds)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    if (!SequelizeManager.sequelize) {
      return next(new ApiError(500, messages.errors.server.dbInit));
    }

    const t = await SequelizeManager.sequelize.transaction();

    try {
      await Library.update(
        { order: 9999 },
        {
          where: {},
          transaction: t,
        }
      );

      for (const [index, libraryId] of orderedLibraryIds.entries()) {
        const newOrder = index;

        await Library.update(
          { order: newOrder },
          {
            where: { id: libraryId },
            transaction: t,
          }
        );
      }

      await t.commit();
      return res.status(200).json({ message: messages.success.order });
    } catch (error) {
      await t.rollback();
      return next(new ApiError(500, messages.errors.order));
    }
  })
);

// Reorder library
router.post(
  "/library/reorder",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { libraryId, orderedItems } = req.body;

    if (!libraryId || !Array.isArray(orderedItems)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    if (!SequelizeManager.sequelize) {
      return next(new ApiError(500, messages.errors.server.dbInit));
    }

    const t = await SequelizeManager.sequelize.transaction();

    try {
      const tempOrder = 9999;

      // Get the library
      const library = await Library.findByPk(libraryId);
      if (!library) {
        await t.rollback();
        return res.status(404).json({ error: "Library not found" });
      }

      // Restore the order of the collections
      await LibraryCollection.update(
        { customOrder: tempOrder },
        { where: { libraryId: libraryId }, transaction: t }
      );

      // Restore the order of the items
      if (library.type === "Movies") {
        await Movie.update(
          { order: tempOrder },
          { where: { libraryId: libraryId }, transaction: t }
        );
      } else if (library.type === "Shows") {
        await Series.update(
          { order: tempOrder },
          { where: { libraryId: libraryId }, transaction: t }
        );
      } else if (library.type === "Music") {
        await Album.update(
          { order: tempOrder },
          { where: { libraryId: libraryId }, transaction: t }
        );
      }

      // Assign the new order to the items
      for (let i = 0; i < orderedItems.length; i++) {
        const item = orderedItems[i];
        const newOrder = i;

        if (item.type === "collection") {
          await LibraryCollection.update(
            { customOrder: newOrder },
            {
              where: { libraryId: libraryId, collectionId: item.id },
              transaction: t,
            }
          );
        } else if (item.type === "movies") {
          await Movie.update(
            { order: newOrder },
            { where: { libraryId: libraryId, id: item.id }, transaction: t }
          );
        } else if (item.type === "shows") {
          await Series.update(
            { order: newOrder },
            { where: { libraryId: libraryId, id: item.id }, transaction: t }
          );
        } else if (item.type === "albums") {
          await Album.update(
            { order: newOrder },
            { where: { libraryId: libraryId, id: item.id }, transaction: t }
          );
        }
      }

      await t.commit();
      return res.status(200).json({ message: messages.success.order });
    } catch (error) {
      await t.rollback();
      return next(new ApiError(500, messages.errors.order));
    }
  })
);

// Update Library
router.put(
  "/library/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedLibraryData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedLibrary = await updateLibrary(id, updatedLibraryData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedLibrary,
    });
  })
);

// Delete Library
router.delete(
  "/libraries/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const deleted = await deleteLibrary(id);

    if (!deleted) {
      return next(new ApiError(404, messages.errors.delete));
    }

    res.status(200).json({ message: messages.success.delete });
  })
);

export default router;
