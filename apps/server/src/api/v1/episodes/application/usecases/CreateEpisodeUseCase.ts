import { Episode } from "../../domain/Episode";
import { EpisodeRepositoryPort } from "../ports/EpisodeRepositoryPort";

export class CreateEpisodeUseCase {
  constructor(private episodeRepo: EpisodeRepositoryPort) {}

  async execute(data: Partial<Episode>): Promise<Episode | null> {
    return this.episodeRepo.create(data);
  }
}
