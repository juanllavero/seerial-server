import { messages } from "@/config/messages";
import ApiError from "@/data/ApiError";
import { NextFunction, Request, Response } from "express";
import { ReorderItemDTO } from "../../../application/dtos/CollectionDTOs";
import { DeleteCollectionUseCase } from "../../../application/usecases/DeleteCollectionUseCase";
import { GetMusicExtrasUseCase } from "../../../application/usecases/GetMusicExtrasUseCase";
import { ReorderCollectionItemsUseCase } from "../../../application/usecases/ReorderCollectionItemsUseCase";
import { UpdateCollectionUseCase } from "../../../application/usecases/UpdateCollectionUseCase";
import { CollectionsRepositoryImpl } from "../../persistence/repositories/CollectionsRepositoryImpl";

const collectionsRepo = new CollectionsRepositoryImpl();

export class CollectionsController {
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

  static async reorderContent(req: Request, res: Response, next: NextFunction) {
    const { collectionId, orderedItems } = req.body;

    if (!collectionId || !Array.isArray(orderedItems)) {
      return next(new ApiError(400, messages.errors.validation.invalidData));
    }

    const useCase = new ReorderCollectionItemsUseCase(collectionsRepo);
    await useCase.execute(collectionId, orderedItems as ReorderItemDTO[]);

    res.status(200).json({ message: messages.success.order });
  }

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
