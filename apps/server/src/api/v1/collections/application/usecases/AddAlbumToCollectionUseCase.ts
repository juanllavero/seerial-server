import { ConflictException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';

export class AddAlbumToCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(collectionId: string, albumId: string): Promise<void> {
    const alreadyExists = await this.collectionRepo.hasAlbum(collectionId, albumId);
    if (alreadyExists) {
      throw new ConflictException(messages.errors.conflict.itemAlreadyInCollection);
    }

    await this.collectionRepo.addAlbum(collectionId, albumId);
  }
}
