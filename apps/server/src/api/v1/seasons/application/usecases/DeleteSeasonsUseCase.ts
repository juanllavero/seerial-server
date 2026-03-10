import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import type { SeasonsRepositoryPort } from '../ports/SeasonsRepositoryPort';

export class DeleteSeasonUseCase {
  constructor(private seasonsRepo: SeasonsRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const season = await this.seasonsRepo.findById(id, 'few');
    if (!season) throw new NotFoundException(`Season with ID ${id} not found`);

    // Delete episodes
    for (const episode of season.episodes || []) {
      await useCases.deleteEpisode().execute(episode.id);
    }

    // Delete local media files and folders
    await useCases.deleteSeasonData().execute(id);

    await this.seasonsRepo.delete(id);
  }
}
