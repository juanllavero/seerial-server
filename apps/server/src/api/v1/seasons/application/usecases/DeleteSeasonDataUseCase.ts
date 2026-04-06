import { fileSystemService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import type { SeasonsRepositoryPort } from '../ports/SeasonsRepositoryPort';

export class DeleteSeasonDataUseCase {
  constructor(private seasonsRepo: SeasonsRepositoryPort) { }

  async execute(id: string): Promise<void> {
    const season = await this.seasonsRepo.findById(id, 'none');
    if (!season) throw new NotFoundException(`Season with ID ${id} not found`);

    fileSystemService.deleteFolder(`resources/img/backgrounds/${season.id}`);
    fileSystemService.deleteFolder(`resources/img/posters/${season.id}`);
    fileSystemService.deleteFolder(`resources/img/logos/${season.id}`);
    fileSystemService.deleteFolder(`resources/music/${season.id}`);
    fileSystemService.deleteFolder(`resources/videos/${season.id}`);
  }
}
