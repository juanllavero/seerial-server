import { MyListRepositoryPort } from "../ports/MyListRepositoryPort";

export class RemoveSeriesFromMyListUseCase {
  constructor(private myListRepo: MyListRepositoryPort) {}

  async execute(seriesId: string, userId: string): Promise<void> {
    await this.myListRepo.removeSeriesFromMyList(seriesId, userId);
  }
}
