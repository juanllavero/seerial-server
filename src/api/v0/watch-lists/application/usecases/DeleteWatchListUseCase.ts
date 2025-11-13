import { WatchListRepositoryPort } from "../ports/WatchListRepositoryPort";

export class DeleteWatchListUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(id: string): Promise<void> {
    await this.watchListRepo.delete(id);
  }
}
