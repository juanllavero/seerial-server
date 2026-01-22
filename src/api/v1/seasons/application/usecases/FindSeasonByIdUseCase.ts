import { IncludeType } from "@/types/common";
import { Season } from "../../domain/Season";
import { SeasonsRepositoryPort } from "../ports/SeasonsRepositoryPort";

export class FindSeasonByIdUseCase {
  constructor(private seasonRepo: SeasonsRepositoryPort) {}

  async execute(id: string, include?: IncludeType): Promise<Season | null> {
    return this.seasonRepo.findById(id, include);
  }
}
