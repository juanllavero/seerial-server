import { Collection } from "../../domain/Collection";
import { CollectionRepositoryPort } from "../ports/CollectionRepositoryPort";

export class UpdateCollectionUseCase {
  constructor(private collectionRepo: CollectionRepositoryPort) {}

  async execute(id: string, data: Partial<Collection>): Promise<Collection> {
    return this.collectionRepo.update(id, data);
  }
}
