import { SeriesRepositoryPort } from "../ports/SeriesRepositoryPort";

export class DeleteSeriesUseCase {
  constructor(private seriesRepo: SeriesRepositoryPort) {}

  async execute(id: string): Promise<void> {
    await this.seriesRepo.delete(id);
  }
}
