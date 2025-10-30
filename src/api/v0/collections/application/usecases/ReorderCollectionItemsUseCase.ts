import { ReorderItemDTO } from "../dtos/CollectionDTOs";
import { CollectionRepositoryPort } from "../ports/CollectionRepositoryPort";

export class ReorderCollectionItemsUseCase {
  constructor(private collectionRepo: CollectionRepositoryPort) {}

  async execute(
    collectionId: string,
    orderedItems: ReorderItemDTO[]
  ): Promise<void> {
    await this.collectionRepo.reorderContent(collectionId, orderedItems);
  }
}
