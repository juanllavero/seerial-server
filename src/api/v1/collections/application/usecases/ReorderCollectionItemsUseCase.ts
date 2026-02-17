import { ReorderItemDTO } from "../dtos/CollectionDTOs";
import { CollectionsRepositoryPort } from "../ports/CollectionsRepositoryPort";

export class ReorderCollectionItemsUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(
    collectionId: string,
    orderedItems: ReorderItemDTO[]
  ): Promise<void> {
    await this.collectionRepo.reorderContent(collectionId, orderedItems);
  }
}
