import { ContinueWatchingRepositoryPort } from "../ports/ContinueWatchingRepositoryPort";

export class GetVideosUseCase {
  constructor(private continueWatchingRepo: ContinueWatchingRepositoryPort) {}

  async execute(userId: string): Promise<void> {
    await this.continueWatchingRepo.getVideos(userId);
  }
}
