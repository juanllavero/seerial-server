import type { Video } from "../../domain/Video";
import type { VideoRepositoryPort } from "../ports/VideosRepositoryPort";

export class FindVideoByMovieIdUseCase {
	constructor(private videoRepo: VideoRepositoryPort) {}

	async execute(id: string): Promise<Video[]> {
		return this.videoRepo.findByMovieId(id);
	}
}
