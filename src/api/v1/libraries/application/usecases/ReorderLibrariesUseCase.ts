import { LibrariesRepositoryPort } from "../ports/LibrariesRepositoryPort";

export class ReorderLibrariesUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(orderedLibrariesIds: string[]): Promise<boolean> {
    return await this.librariesRepo.reorder(orderedLibrariesIds);
  }
}
