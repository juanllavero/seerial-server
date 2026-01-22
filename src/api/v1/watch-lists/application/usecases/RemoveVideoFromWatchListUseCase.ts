import { WatchListRepositoryPort } from "../ports/WatchListRepositoryPort";

export class RemoveVideoFromWatchListUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(userId: string, videoId: string): Promise<void> {
    await this.watchListRepo.removeVideo(userId, videoId);
  }
}
