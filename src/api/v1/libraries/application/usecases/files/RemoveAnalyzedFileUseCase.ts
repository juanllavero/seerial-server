import { Library } from "../../../domain/Library";
import { LibrariesRepositoryPort } from "../../ports/LibrariesRepositoryPort";

export class RemoveAnalyzedFileUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(libraryId: string, file: string): Promise<Library> {
    return await this.librariesRepo.removeAnalyzedFile(libraryId, file);
  }
}
