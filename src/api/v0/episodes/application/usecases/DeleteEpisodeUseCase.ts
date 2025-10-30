import { EpisodeRepositoryPort } from "../ports/EpisodeRepositoryPort";

export class DeleteEpisodeUseCase {
  constructor(private episodeRepo: EpisodeRepositoryPort) {}

  async execute(id: string): Promise<void> {
    await this.episodeRepo.delete(id);
  }
}
