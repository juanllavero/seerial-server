import type { Movie } from '../../domain/Movie';
import type { MoviesRepositoryPort } from '../ports/MoviesRepositoryPort';

export class FindAllMoviesUseCase {
    constructor(private readonly movieRepository: MoviesRepositoryPort) { }

    async execute(libraryId: string): Promise<Movie[]> {
        return await this.movieRepository.findAll(libraryId);
    }
}
