import type { SeriesRepositoryPort } from '../ports/SeriesRepositoryPort';

export class UpdateSeriesMetadataUseCase {
  constructor(readonly _seriesRepo: SeriesRepositoryPort) {}

  async execute(): Promise<void> {}
}
