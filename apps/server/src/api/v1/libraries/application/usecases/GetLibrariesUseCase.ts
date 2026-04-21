import { wakeUpDrives } from '@/utils/driveWakeUp';
import type { Library } from '../../domain/Library';
import type { LibrariesRepositoryPort } from '../ports/LibrariesRepositoryPort';

export class GetLibrariesUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(): Promise<Library[]> {
    const libraries = await this.librariesRepo.getAll();

    const allFolders = libraries.flatMap((library) => library.folders);
    wakeUpDrives(allFolders);

    return libraries;
  }
}
