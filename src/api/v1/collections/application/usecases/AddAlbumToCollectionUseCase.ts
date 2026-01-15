import { CollectionsRepositoryPort } from "../ports/CollectionRepositoryPort";

export class AddAlbumToCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(collectionId: string, albumId: string): Promise<void> {
    await this.collectionRepo.addAlbum(collectionId, albumId);
  }
}
