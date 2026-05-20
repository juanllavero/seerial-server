import type { Season } from '../../domain/Season';
import type { SeasonsRepositoryPort } from '../ports/SeasonsRepositoryPort';

export class FindSeasonsBySeriesIdUseCase {
  constructor(private seasonRepo: SeasonsRepositoryPort) {}

  async execute(id: string): Promise<Season[]> {
    return this.seasonRepo.findSeasonsBySeriesId(id);
  }
}
