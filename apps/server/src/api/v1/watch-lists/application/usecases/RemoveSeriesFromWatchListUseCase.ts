import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class RemoveSeriesFromWatchListUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(userId: string, seriesId: string): Promise<void> {
    await this.watchListRepo.removeSeries(userId, seriesId);
  }
}
