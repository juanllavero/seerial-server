import { ContinueWatchingRepositoryPort } from "../ports/ContinueWatchingRepositoryPort";

export class DeleteUseCase {
  constructor(private continueWatchingRepo: ContinueWatchingRepositoryPort) {}

  async execute(videoId: string, userId?: string): Promise<void> {
    await this.continueWatchingRepo.delete(videoId, userId);
  }
}
