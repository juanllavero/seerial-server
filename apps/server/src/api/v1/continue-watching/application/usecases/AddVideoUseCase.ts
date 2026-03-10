import type { ContinueWatchingRepositoryPort } from '../ports/ContinueWatchingRepositoryPort';

export class AddVideoUseCase {
  constructor(private continueWatchingRepo: ContinueWatchingRepositoryPort) {}

  async execute(
    videoId: string,
    userId: string,
    seriesId?: string,
    movieId?: string,
  ): Promise<void> {
    await this.continueWatchingRepo.add(videoId, userId, seriesId, movieId);
  }
}
