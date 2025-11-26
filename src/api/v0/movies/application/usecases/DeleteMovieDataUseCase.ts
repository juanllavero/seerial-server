import { fileSystemService } from "@/api/v0/shared/infrastructure/adapters/di/container";

export class DeleteMovieDataUseCase {
  constructor() {}

  async execute(id: string): Promise<void> {
    fileSystemService.deleteFolder(`resources/img/backgrounds/${id}`);
    fileSystemService.deleteFolder(`resources/img/posters/${id}`);
    fileSystemService.deleteFolder(`resources/img/logos/${id}`);

    fileSystemService.deleteFolder(`resources/img/backgrounds/${id}`);
    fileSystemService.deleteFolder(`resources/img/posters/${id}`);
    fileSystemService.deleteFolder(`resources/img/logos/${id}`);
  }
}
