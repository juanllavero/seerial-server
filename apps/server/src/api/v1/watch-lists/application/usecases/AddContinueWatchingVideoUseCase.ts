import type { WatchList } from '../../domain/WatchList';
import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class AddContinueWatchingVideoUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(
    videoId: string,
    userId: string,
    seriesId?: string,
    movieId?: string,
  ): Promise<WatchList> {
    return await this.watchListRepo.addContinueWatchingVideo(videoId, userId, seriesId, movieId);
  }
}
