import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class ClearContinueWatchingUseCase {
    constructor(private watchListRepo: WatchListRepositoryPort) { }

    async execute(userId: string, seriesId?: string, movieId?: string): Promise<boolean> {
        return await this.watchListRepo.clearContinueWatching(userId, seriesId, movieId);
    }
}
