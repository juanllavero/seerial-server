import type { WatchListRepositoryPort } from "../ports/WatchListRepositoryPort";

export class RemoveContinueWatchingVideoUseCase {
	constructor(private watchListRepo: WatchListRepositoryPort) {}

	async execute(videoId: string, userId?: string): Promise<void> {
		await this.watchListRepo.removeContinueWatchingVideo(videoId, userId);
	}
}
