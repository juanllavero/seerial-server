import type { Season } from '@seerial/domain';
import type { WatchListRepositoryPort } from '../ports/WatchListRepositoryPort';

export class GetCurrentSeasonUseCase {
    constructor(private watchListRepo: WatchListRepositoryPort) { }

    async execute(seriesId: string, userId?: string): Promise<Season | null> {
        return await this.watchListRepo.findCurrentSeason(seriesId, userId);
    }
}
