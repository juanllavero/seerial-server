import type { LibrariesRepositoryPort } from '@/api/v1/libraries/application/ports/LibrariesRepositoryPort';
import type { CollectionContentDTO } from '../dtos/CollectionDTOs';

export class GetCollectionContentUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(collectionId: string, userId: string): Promise<CollectionContentDTO> {
    return await this.librariesRepo.getCollectionContent(collectionId, userId);
  }
}
