import { Series } from "../../domain/Series";
import { SeriesRepositoryPort } from "../ports/SeriesRepositoryPort";

export class UpdateSeriesUseCase {
  constructor(private seriesRepo: SeriesRepositoryPort) {}

  async execute(id: string, data: Partial<Series>): Promise<Series> {
    return this.seriesRepo.update(id, data);
  }
}
