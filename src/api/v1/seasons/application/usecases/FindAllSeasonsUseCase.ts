import { Season } from "../../domain/Season";
import { SeasonsRepositoryPort } from "../ports/SeasonsRepositoryPort";

export class FindAllSeasonsUseCase {
  constructor(private seasonsRepo: SeasonsRepositoryPort) {}

  async execute(libraryId: string): Promise<Season[]> {
    return await this.seasonsRepo.findAll(libraryId);
  }
}
