import { ConflictException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';

export class AddSeriesToCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(collectionId: string, seriesId: string): Promise<void> {
    const alreadyExists = await this.collectionRepo.hasSeries(collectionId, seriesId);
    if (alreadyExists) {
      throw new ConflictException(messages.errors.conflict.itemAlreadyInCollection);
    }

    await this.collectionRepo.addSeries(collectionId, seriesId);
  }
}
