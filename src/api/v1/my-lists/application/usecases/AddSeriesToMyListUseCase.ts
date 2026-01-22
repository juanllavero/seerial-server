import { MyListItem } from "../../domain/MyList";
import { MyListRepositoryPort } from "../ports/MyListRepositoryPort";

export class AddSeriesToMyListUseCase {
  constructor(private myListRepo: MyListRepositoryPort) {}

  async execute(seriesId: string, userId: string): Promise<MyListItem | null> {
    return await this.myListRepo.addSeriesToMyList(seriesId, userId);
  }
}
