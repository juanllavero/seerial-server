import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { NotFoundException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { EpisodeRepositoryPort } from "../ports/EpisodeRepositoryPort";

export class DeleteEpisodeUseCase {
  constructor(private episodeRepo: EpisodeRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const episode = await this.episodeRepo.findById(id);
    if (!episode)
      throw new NotFoundException(`Episode with ID ${id} not found`);

    // Delete associated video
    await useCases.deleteVideo().execute(episode.video.id);

    // Delete episode
    await this.episodeRepo.delete(id);
  }
}
