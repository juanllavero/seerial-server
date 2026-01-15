import { Series } from "@/api/v1/series/domain/Series";
import { MyListRepositoryPort } from "../ports/MyListRepositoryPort";

export class GetSeriesFromMyListUseCase {
  constructor(private myListRepo: MyListRepositoryPort) {}

  async execute(userId: string): Promise<Series[]> {
    return await this.myListRepo.getSeriesFromMyList(userId);
  }
}
