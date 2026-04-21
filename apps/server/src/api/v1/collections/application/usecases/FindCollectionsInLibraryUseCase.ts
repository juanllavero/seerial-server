import type { Collection } from '../../domain/Collection';
import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';

export class FindCollectionsInLibraryUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(id: string): Promise<Collection[]> {
    return await this.collectionRepo.getAll(id);
  }
}
