import type { Movie } from '../../domain/Movie';
import type { MoviesRepositoryPort } from '../ports/MoviesRepositoryPort';

export class UpdateMovieUseCase {
  constructor(private moviesRepo: MoviesRepositoryPort) {}

  async execute(id: string, data: Partial<Movie>): Promise<Movie> {
    return this.moviesRepo.update(id, data);
  }
}
