import { Episode } from "../../domain/Episode";
import { EpisodeRepositoryPort } from "../ports/EpisodeRepositoryPort";

export class GetAllBySeasonIdUseCase {
  constructor(private episodeRepo: EpisodeRepositoryPort) {}

  async execute(seasonId: string): Promise<Episode[]> {
    return this.episodeRepo.findAllBySeasonId(seasonId);
  }
}
