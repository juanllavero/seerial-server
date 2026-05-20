import { ConflictException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';

export class RemoveSeriesFromCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(collectionId: string, seriesId: string): Promise<void> {
    const exists = await this.collectionRepo.hasSeries(collectionId, seriesId);
    if (!exists) {
      throw new ConflictException(messages.errors.conflict.itemNotInCollection);
    }

    await this.collectionRepo.removeSeries(collectionId, seriesId);
  }
}
