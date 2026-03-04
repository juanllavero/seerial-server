import { Season } from "../../domain/Season";
import { SeasonsRepositoryPort } from "../ports/SeasonsRepositoryPort";

export class UpdateSeasonUseCase {
  constructor(private seasonsRepo: SeasonsRepositoryPort) {}

  async execute(id: string, data: Partial<Season>): Promise<Season> {
    return await this.seasonsRepo.update(id, data);
  }
}
