import { Series } from "../../domain/Series";
import { SeriesRepositoryPort } from "../ports/SeriesRepositoryPort";

export class FindSeriesByIdUseCase {
  constructor(private seriesRepo: SeriesRepositoryPort) {}

  async execute(id: string): Promise<Series | null> {
    return this.seriesRepo.findById(id);
  }
}
