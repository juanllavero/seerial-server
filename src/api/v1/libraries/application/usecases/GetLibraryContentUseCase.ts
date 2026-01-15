import { LibraryItem } from "@/data/interfaces/Media";
import { LibrariesRepositoryPort } from "../ports/LibrariesRepositoryPort";

export class GetLibraryContentUseCase {
  constructor(private librariesRepo: LibrariesRepositoryPort) {}

  async execute(
    id: string,
    type: string,
    userId: string,
    flat: string
  ): Promise<LibraryItem[]> {
    return await this.librariesRepo.getContent(id, type, userId, flat);
  }
}
