import { Series } from "@/api/v0/series/domain/Series";
import { MyListRepositoryPort } from "../ports/MyListRepositoryPort";

export class GetSeriesFromMyListUseCase {
  constructor(private myListRepo: MyListRepositoryPort) {}

  async execute(userId: string): Promise<Series[]> {
    return await this.myListRepo.getSeriesFromMyList(userId);
  }
}
