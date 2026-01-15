import { MyListRepositoryPort } from "../ports/MyListRepositoryPort";

export class IsSeriesInMyListUseCase {
  constructor(private myListRepo: MyListRepositoryPort) {}

  async execute(seriesId: string, userId: string): Promise<boolean> {
    return await this.myListRepo.isSeriesInMyList(seriesId, userId);
  }
}
