import { SeriesRepositoryPort } from "../ports/SeriesRepositoryPort";

export class UpdateSeriesMetadataUseCase {
  constructor(private readonly seriesRepo: SeriesRepositoryPort) {}

  async execute(): Promise<void> {}
}
