import type { Episode } from "../../domain/Episode";
import type { EpisodeRepositoryPort } from "../ports/EpisodeRepositoryPort";

export class FindEpisodeByIdUseCase {
	constructor(private episodeRepo: EpisodeRepositoryPort) {}

	async execute(id: string): Promise<Episode | null> {
		return this.episodeRepo.findById(id);
	}
}
