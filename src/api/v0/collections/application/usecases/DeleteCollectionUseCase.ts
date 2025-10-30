import { CollectionRepositoryPort } from "../ports/CollectionRepositoryPort";

export class DeleteCollectionUseCase {
  constructor(private collectionRepo: CollectionRepositoryPort) {}

  async execute(id: string): Promise<boolean> {
    return await this.collectionRepo.delete(id);
  }
}
