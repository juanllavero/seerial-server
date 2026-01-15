import { MyListRepositoryPort } from "../ports/MyListRepositoryPort";

export class IsMovieInMyListUseCase {
  constructor(private myListRepo: MyListRepositoryPort) {}

  async execute(movieId: string, userId: string): Promise<boolean> {
    return await this.myListRepo.isMovieInMyList(movieId, userId);
  }
}
