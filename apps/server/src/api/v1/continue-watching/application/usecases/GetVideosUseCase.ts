import { ContinueWatchingVideo } from "../dtos/ContinueWatchingDTOs";
import { ContinueWatchingRepositoryPort } from "../ports/ContinueWatchingRepositoryPort";

export class GetVideosUseCase {
  constructor(private continueWatchingRepo: ContinueWatchingRepositoryPort) {}

  async execute(userId: string): Promise<ContinueWatchingVideo[]> {
    return await this.continueWatchingRepo.getVideos(userId);
  }
}
