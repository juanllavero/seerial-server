import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { SequelizeManager } from "@/managers/SequelizeManager";
import catchAsync from "@/utils/catchAsync";
import express, { NextFunction, Request, Response } from "express";
import { CollectionAlbum } from "./collection-album.model";
import { CollectionMovie } from "./collection-movie.model";
import { CollectionSeries } from "./collection-series.model";
import { deleteCollection, updateCollection } from "./collections.service";

const router = express.Router();

router.post(
  "/collections/reorder-content",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { collectionId, orderedItems } = req.body;

    if (!collectionId || !Array.isArray(orderedItems)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    if (!SequelizeManager.sequelize) {
      return next(new ApiError(500, messages.errors.server.dbInit));
    }

    const t = await SequelizeManager.sequelize.transaction();

    try {
      const tempOrder = 9999;

      // Restore the order of the items
      await CollectionMovie.update(
        { customOrder: tempOrder },
        { where: { collectionId }, transaction: t }
      );
      await CollectionSeries.update(
        { customOrder: tempOrder },
        { where: { collectionId }, transaction: t }
      );
      await CollectionAlbum.update(
        { customOrder: tempOrder },
        { where: { collectionId }, transaction: t }
      );

      // Assign the new order to the items
      for (const [index, item] of orderedItems.entries()) {
        const newOrder = index;

        switch (item.type) {
          case "movie":
          case "movies":
            await CollectionMovie.update(
              { customOrder: newOrder },
              {
                where: { collectionId, movieId: item.id },
                transaction: t,
              }
            );
            break;
          case "series":
          case "show":
          case "shows":
            await CollectionSeries.update(
              { customOrder: newOrder },
              {
                where: { collectionId, seriesId: item.id },
                transaction: t,
              }
            );
            break;
          case "album":
          case "albums":
            await CollectionAlbum.update(
              { customOrder: newOrder },
              {
                where: { collectionId, albumId: item.id },
                transaction: t,
              }
            );
            break;
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

// Update Collection
router.put(
  "/collection/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const updatedCollectionData = req.body;
    const id = req.params.id;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const updatedCollection = await updateCollection(id, updatedCollectionData);
    return res.status(200).json({
      status: "success",
      message: messages.success.update,
      data: updatedCollection,
    });
  })
);

// Delete collection
router.delete(
  "/collection/:id",
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      return next(new ApiError(400, messages.errors.validation.missingId));
    }

    const deleted = await deleteCollection(id);

    if (!deleted) {
      return next(new ApiError(404, messages.errors.delete));
    }

    res.status(200).json({ message: messages.success.delete });
  })
);

export default router;
