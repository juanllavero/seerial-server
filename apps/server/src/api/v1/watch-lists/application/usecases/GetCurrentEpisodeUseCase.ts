import type { Episode } from '@seerial/domain';
import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class GetCurrentEpisodeUseCase {
    constructor(private watchListRepo: WatchListRepositoryPort) { }

    async execute(seasonId: string, userId?: string): Promise<Episode | null> {
        return await this.watchListRepo.findCurrentEpisode(seasonId, userId);
    }
}
