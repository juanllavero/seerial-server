import type { CollectionSummaryDTO } from '../dtos/CollectionDTOs';
import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';

export class GetAllCollectionsUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(): Promise<CollectionSummaryDTO[]> {
    return this.collectionRepo.getAllSummary();
  }
}
