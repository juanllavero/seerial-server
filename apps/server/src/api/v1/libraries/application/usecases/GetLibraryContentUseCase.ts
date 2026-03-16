import type { LibraryItem } from '@seerial/domain';
import type { LibrariesRepositoryPort } from '../ports/LibrariesRepositoryPort';

export class GetLibraryContentUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) { }

  async execute(id: string, userId: string): Promise<LibraryItem[]> {
    return await this.librariesRepo.getContent(id, userId);
  }
}
