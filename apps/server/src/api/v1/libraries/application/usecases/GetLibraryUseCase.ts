import { Library } from "../../domain/Library";
import { LibrariesRepositoryPort } from "../ports/LibrariesRepositoryPort";

export class GetLibraryUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(id: string): Promise<Library | null> {
    return await this.librariesRepo.getById(id);
  }
}
