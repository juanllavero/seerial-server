import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class AddVideoToWatchListUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(userId: string, videoId: string): Promise<void> {
    await this.watchListRepo.addVideo(userId, videoId);
  }
}
