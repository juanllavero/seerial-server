import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class AddSeriesToWatchListUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(userId: string, seriesId: string): Promise<void> {
    await this.watchListRepo.addSeries(userId, seriesId);
  }
}
