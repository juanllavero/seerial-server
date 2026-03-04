import { Library } from "../../../domain/Library";
import { LibrariesRepositoryPort } from "../../ports/LibrariesRepositoryPort";

export class RemoveAnalyzedFolderUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(libraryId: string, folder: string): Promise<Library> {
    return await this.librariesRepo.removeAnalyzedFolder(libraryId, folder);
  }
}
