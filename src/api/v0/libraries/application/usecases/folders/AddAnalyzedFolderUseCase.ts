import { Library } from "../../../domain/Library";
import { LibrariesRepositoryPort } from "../../ports/LibrariesRepositoryPort";

export class AddAnalyzedFolderUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(
    libraryId: string,
    file: string,
    videoId: string
  ): Promise<Library> {
    return await this.librariesRepo.addAnalyzedFolder(libraryId, file, videoId);
  }
}
