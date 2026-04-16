import type { Episode } from "../../domain/Episode";
import type { EpisodeRepositoryPort } from "../ports/EpisodeRepositoryPort";

export class FindEpisodesBySeasonIdUseCase {
	constructor(private episodeRepo: EpisodeRepositoryPort) {}

	async execute(seasonId: string): Promise<Episode[]> {
		return this.episodeRepo.findAllBySeasonId(seasonId);
	}
}
