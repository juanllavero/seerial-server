import { IncludeType } from "@/utils/utils";
import { Series } from "../../domain/Series";
import { SeriesRepositoryPort } from "../ports/SeriesRepositoryPort";

export class FindSeriesByIdUseCase {
  constructor(private seriesRepo: SeriesRepositoryPort) {}

  async execute(id: string, include?: IncludeType): Promise<Series | null> {
    return this.seriesRepo.findById(id, include);
  }
}
