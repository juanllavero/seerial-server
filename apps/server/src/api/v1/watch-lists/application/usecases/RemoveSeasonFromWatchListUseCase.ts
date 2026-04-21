import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class RemoveSeasonFromWatchListUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(userId: string, seasonId: string): Promise<void> {
    await this.watchListRepo.removeSeason(userId, seasonId);
  }
}
