import type { ContinueWatchingVideoDTO } from '@seerial/domain';
import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class GetContinueWatchingVideosUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) { }

  async execute(userId: string): Promise<ContinueWatchingVideoDTO[]> {
    return await this.watchListRepo.getContinueWatchingVideos(userId);
  }
}
