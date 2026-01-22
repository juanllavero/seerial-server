import { ContinueWatchingRepositoryPort } from "../ports/ContinueWatchingRepositoryPort";

export class GetVideosUseCase {
  constructor(private continueWatchingRepo: ContinueWatchingRepositoryPort) {}

  async execute(userId: string): Promise<any[]> {
    return await this.continueWatchingRepo.getVideos(userId);
  }
}
