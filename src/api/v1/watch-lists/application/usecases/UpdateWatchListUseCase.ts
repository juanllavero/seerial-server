import { WatchList } from "../../domain/WatchList";
import { WatchListRepositoryPort } from "../ports/WatchListRepositoryPort";

export class UpdateWatchListUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(id: string, data: Partial<WatchList>): Promise<WatchList> {
    return this.watchListRepo.update(id, data);
  }
}
