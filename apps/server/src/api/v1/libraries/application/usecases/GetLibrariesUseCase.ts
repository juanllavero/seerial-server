import { Library } from "../../domain/Library";
import { LibrariesRepositoryPort } from "../ports/LibrariesRepositoryPort";

export class GetLibrariesUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(): Promise<Library[]> {
    return await this.librariesRepo.getAll();
  }
}
