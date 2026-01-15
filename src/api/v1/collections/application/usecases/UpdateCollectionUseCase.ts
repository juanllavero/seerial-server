import { Collection } from "../../domain/Collection";
import { CollectionsRepositoryPort } from "../ports/CollectionRepositoryPort";

export class UpdateCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(id: string, data: Partial<Collection>): Promise<Collection> {
    return this.collectionRepo.update(id, data);
  }
}
