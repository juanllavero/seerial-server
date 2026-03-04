import { Movie } from "../../domain/Movie";
import { MoviesRepositoryPort } from "../ports/MoviesRepositoryPort";

export class FindMovieByPathUseCase {
  constructor(private readonly movieRepository: MoviesRepositoryPort) {}

  async execute(path: string): Promise<Movie | null> {
    return await this.movieRepository.findByPath(path);
  }
}
