import type { IncludeType } from '@/types/common';
import type { Series } from '../../domain/Series';
import type { SeriesRepositoryPort } from '../ports/SeriesRepositoryPort';

export class FindSeriesByIdUseCase {
  constructor(private seriesRepo: SeriesRepositoryPort) {}

  async execute(id: string, include?: IncludeType): Promise<Series | null> {
    return this.seriesRepo.findById(id, include);
  }
}
