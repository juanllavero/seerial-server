import type { ContinueWatchingVideoDTO } from '../dtos/WatchListDTOs';
import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class GetContinueWatchingVideosUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(userId: string): Promise<ContinueWatchingVideoDTO[]> {
    return await this.watchListRepo.getContinueWatchingVideos(userId);
  }
}
