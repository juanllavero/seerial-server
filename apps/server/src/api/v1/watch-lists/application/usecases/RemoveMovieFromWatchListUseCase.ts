import type { WatchListRepositoryPort } from "../ports/WatchListRepositoryPort";

export class RemoveMovieFromWatchListUseCase {
	constructor(private watchListRepo: WatchListRepositoryPort) {}

	async execute(userId: string, movieId: string): Promise<void> {
		await this.watchListRepo.removeMovie(userId, movieId);
	}
}
