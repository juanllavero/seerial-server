import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class AddMovieToWatchListUseCase {
  constructor(private watchListRepo: WatchListRepositoryPort) {}

  async execute(userId: string, movieId: string): Promise<void> {
    await this.watchListRepo.addMovie(userId, movieId);
  }
}
