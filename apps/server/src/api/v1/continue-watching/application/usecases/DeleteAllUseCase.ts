import { ContinueWatchingRepositoryPort } from "../ports/ContinueWatchingRepositoryPort";

export class DeleteAllUseCase {
  constructor(private continueWatchingRepo: ContinueWatchingRepositoryPort) {}

  async execute(
    userId: string,
    seriesId?: string,
    movieId?: string
  ): Promise<void> {
    await this.continueWatchingRepo.deleteAll(userId, seriesId, movieId);
  }
}
