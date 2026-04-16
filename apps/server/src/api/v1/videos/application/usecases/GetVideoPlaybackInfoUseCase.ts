import type { PlayBackInfo } from "@seerial/domain";
import type { VideoRepositoryPort } from "../ports/VideosRepositoryPort";

export class GetVideoPlaybackInfoUseCase {
	constructor(private videoRepo: VideoRepositoryPort) {}

	async execute(id: string): Promise<PlayBackInfo> {
		return this.videoRepo.getVideoPlaybackInfo(id);
	}
}
