import { Season } from "../../domain/Season";
import { SeasonsRepositoryPort } from "../ports/SeasonsRepositoryPort";

export class CreateSeasonUseCase {
  constructor(private seasonsRepo: SeasonsRepositoryPort) {}

  async execute(data: Partial<Season>): Promise<Season> {
    return await this.seasonsRepo.create(data);
  }
}
