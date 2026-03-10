import { fileSystemService } from '@/api/v1/shared/infrastructure/adapters/di/container';

export class DeleteSeriesDataUseCase {
  constructor() {}

  async execute(seriesId: string): Promise<void> {
    fileSystemService.deleteFolder(`resources/img/posters/${seriesId}`);
    fileSystemService.deleteFolder(`resources/img/logos/${seriesId}`);
  }
}
