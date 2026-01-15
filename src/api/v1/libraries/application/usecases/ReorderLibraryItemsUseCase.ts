import { LibrariesRepositoryPort } from "../ports/LibrariesRepositoryPort";

export class ReorderLibraryItemsUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(
    libraryId: string,
    orderedItems: {
      id: string;
      type: string;
    }[]
  ): Promise<boolean> {
    return await this.librariesRepo.reorderItems(libraryId, orderedItems);
  }
}
