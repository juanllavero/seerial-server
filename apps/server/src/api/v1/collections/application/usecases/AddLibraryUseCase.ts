import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';

export class AddLibraryToCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(libraryId: string, collectionId: string): Promise<void> {
    await this.collectionRepo.addLibrary(libraryId, collectionId);
  }
}
