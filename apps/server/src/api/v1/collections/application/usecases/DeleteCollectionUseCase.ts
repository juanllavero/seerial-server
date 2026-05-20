import { contentCleanupService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';

export class DeleteCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(id: string): Promise<boolean> {
    contentCleanupService.cleanCollection(id);
    return await this.collectionRepo.delete(id);
  }
}
