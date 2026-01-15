import { CollectionsRepositoryPort } from "../ports/CollectionRepositoryPort";

export class DeleteCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(id: string): Promise<boolean> {
    return await this.collectionRepo.delete(id);
  }
}
