import { Episode } from "../../domain/Episode";
import { EpisodeRepositoryPort } from "../ports/EpisodeRepositoryPort";

export class UpdateEpisodeUseCase {
  constructor(private episodeRepo: EpisodeRepositoryPort) {}

  async execute(id: string, data: Partial<Episode>): Promise<Episode> {
    return this.episodeRepo.update(id, data);
  }
}
