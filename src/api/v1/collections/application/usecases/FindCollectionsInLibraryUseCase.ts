import { Collection } from "../../domain/Collection";
import { CollectionsRepositoryPort } from "../ports/CollectionRepositoryPort";

export class FindCollectionsInLibraryUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(id: string): Promise<Collection[]> {
    return await this.collectionRepo.getAll(id);
  }
}
