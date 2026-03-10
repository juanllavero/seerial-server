import type { ContinueWatchingRepositoryPort } from '../ports/ContinueWatchingRepositoryPort';

export class GetCurrentEpisodeUseCase {
  constructor(private continueWatchingRepo: ContinueWatchingRepositoryPort) {}

  async execute(seriesId: string): Promise<void> {
    await this.continueWatchingRepo.getCurrentEpisode(seriesId);
  }
}
