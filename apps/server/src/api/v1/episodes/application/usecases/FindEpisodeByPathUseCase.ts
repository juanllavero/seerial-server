import type { Episode } from "../../domain/Episode";
import type { EpisodeRepositoryPort } from "../ports/EpisodeRepositoryPort";

export class FindEpisodeByPathUseCase {
	constructor(private episodeRepo: EpisodeRepositoryPort) {}

	async execute(path: string): Promise<Episode | null> {
		return this.episodeRepo.findByVideoSrc(path);
	}
}
