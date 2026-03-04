import { MyListRepositoryPort } from "../ports/MyListRepositoryPort";

export class RemoveMovieFromMyListUseCase {
  constructor(private myListRepo: MyListRepositoryPort) {}

  async execute(movieId: string, userId: string): Promise<void> {
    await this.myListRepo.removeMovieFromMyList(movieId, userId);
  }
}
