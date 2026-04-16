import type { Video } from "@seerial/domain";
import type { WatchListRepositoryPort } from "../ports/WatchListRepositoryPort";

export class GetCurrentVideoUseCase {
	constructor(private watchListRepo: WatchListRepositoryPort) {}

	async execute(movieId: string, userId?: string): Promise<Video | null> {
		return await this.watchListRepo.findCurrentVideo(movieId, userId);
	}
}
