import { Series } from "../../domain/Series";
import { SeriesRepositoryPort } from "../ports/SeriesRepositoryPort";

export class CreateSeriesUseCase {
  constructor(private seriesRepo: SeriesRepositoryPort) {}

  async execute(data: Partial<Series>): Promise<Series> {
    return this.seriesRepo.create(data);
  }
}
