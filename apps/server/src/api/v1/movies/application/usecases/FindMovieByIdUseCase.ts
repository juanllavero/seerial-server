import type { Movie } from '../../domain/Movie';
import type { MoviesRepositoryPort } from '../ports/MoviesRepositoryPort';

export class FindMovieByIdUseCase {
  constructor(private readonly movieRepository: MoviesRepositoryPort) {}

  async execute(id: string): Promise<Movie | null> {
    return await this.movieRepository.findById(id);
  }
}
