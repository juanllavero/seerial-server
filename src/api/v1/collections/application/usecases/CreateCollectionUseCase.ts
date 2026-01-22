import { Collection } from "../../domain/Collection";
import { CollectionsRepositoryPort } from "../ports/CollectionRepositoryPort";

export class CreateCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(data: Partial<Collection>): Promise<Collection | null> {
    return await this.collectionRepo.add(data);
  }
}
