import { Movie } from "@/api/v0/movies/domain/Movie";
import { MyListRepositoryPort } from "../ports/MyListRepositoryPort";

export class GetMoviesFromMyListUseCase {
  constructor(private myListRepo: MyListRepositoryPort) {}

  async execute(userId: string): Promise<Movie[]> {
    return await this.myListRepo.getMoviesFromMyList(userId);
  }
}
