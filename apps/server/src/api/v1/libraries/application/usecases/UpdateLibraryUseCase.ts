import { Library } from "../../domain/Library";
import { LibrariesRepositoryPort } from "../ports/LibrariesRepositoryPort";

export class UpdateLibraryUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(id: string, data: Partial<Library>): Promise<Library> {
    return this.librariesRepo.update(id, data);
  }
}
