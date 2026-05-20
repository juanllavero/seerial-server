import { ConflictException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';

export class RemoveAlbumFromCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(collectionId: string, albumId: string): Promise<void> {
    const exists = await this.collectionRepo.hasAlbum(collectionId, albumId);
    if (!exists) {
      throw new ConflictException(messages.errors.conflict.itemNotInCollection);
    }

    await this.collectionRepo.removeAlbum(collectionId, albumId);
  }
}
