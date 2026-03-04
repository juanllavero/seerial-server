import { Collection } from "../../domain/Collection";
import { CollectionsRepositoryPort } from "../ports/CollectionsRepositoryPort";

export class CreateCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(data: Partial<Collection>): Promise<Collection | null> {
    return await this.collectionRepo.add(data);
  }
}
