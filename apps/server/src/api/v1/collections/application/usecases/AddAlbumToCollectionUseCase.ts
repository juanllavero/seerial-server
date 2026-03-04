import { CollectionsRepositoryPort } from "../ports/CollectionsRepositoryPort";

export class AddAlbumToCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(collectionId: string, albumId: string): Promise<void> {
    await this.collectionRepo.addAlbum(collectionId, albumId);
  }
}
