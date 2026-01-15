import { WatchListRepositoryPort } from "../ports/WatchListRepositoryPort";

export class AddSeasonToWatchListUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(userId: string, seasonId: string): Promise<void> {
    await this.watchListRepo.addSeason(userId, seasonId);
  }
}
