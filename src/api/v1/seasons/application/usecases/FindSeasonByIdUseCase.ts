import { Season } from "../../domain/Season";
import { SeasonsRepositoryPort } from "../ports/SeasonsRepositoryPort";

export class FindSeasonByIdUseCase {
  constructor(private seasonRepo: SeasonsRepositoryPort) {}

  async execute(id: string): Promise<Season | null> {
    return this.seasonRepo.findById(id);
  }
}
