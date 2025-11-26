import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { EpisodeRepositoryPort } from "../ports/EpisodeRepositoryPort";

export class DeleteEpisodeUseCase {
  private deleteVideo = useCases.deleteVideo();

  constructor(private episodeRepo: EpisodeRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const episode = await this.episodeRepo.findById(id);
    if (!episode) throw new Error(`Episode with ID ${id} not found`);

    // Delete associated video
    await this.deleteVideo.execute(episode.video.id);

    // Delete episode
    await this.episodeRepo.delete(id);
  }
}
