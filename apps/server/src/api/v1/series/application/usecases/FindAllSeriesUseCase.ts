import { IncludeType } from '@/types/common';
import type { Series } from '../../domain/Series';
import type { SeriesRepositoryPort } from '../ports/SeriesRepositoryPort';

export class FindAllSeriesUseCase {
    constructor(private seriesRepo: SeriesRepositoryPort) { }

    async execute(libraryId: string, include?: IncludeType): Promise<Series[]> {
        return this.seriesRepo.findAll(libraryId, include);
    }
}
