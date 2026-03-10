import type { LibrariesRepositoryPort } from '../ports/LibrariesRepositoryPort';

export class GetLibraryByVideoIdUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(id: string): Promise<any> {
    return await this.librariesRepo.getByVideoId(id);
  }
}
