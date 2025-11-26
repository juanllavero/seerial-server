import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { SeasonsRepositoryPort } from "../ports/SeasonsRepositoryPort";

export class DeleteSeasonUseCase {
  private deleteSeasonData = useCases.deleteSeasonData();
  private deleteEpisode = useCases.deleteEpisode();

  constructor(private seasonsRepo: SeasonsRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const season = await this.seasonsRepo.findById(id, "few");
    if (!season) throw new Error(`Season with ID ${id} not found`);

    // Delete episodes
    for (const episode of season.episodes || []) {
      await this.deleteEpisode.execute(episode.id);
    }

    // Delete local media files and folders
    await this.deleteSeasonData.execute(id);

    await this.seasonsRepo.delete(id);
  }
}
