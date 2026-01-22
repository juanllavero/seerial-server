import { fileSystemService } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { SeasonsRepositoryPort } from "../ports/SeasonsRepositoryPort";

export class DeleteSeasonDataUseCase {
  constructor(private seasonsRepo: SeasonsRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const season = await this.seasonsRepo.findById(id, "none");
    if (!season) throw new Error(`Season with ID ${id} not found`);

    fileSystemService.deleteFolder(`resources/img/backgrounds/${season.id}`);
    fileSystemService.deleteFolder(`resources/img/posters/${season.id}`);
    fileSystemService.deleteFolder(`resources/img/logos/${season.id}`);

    if (season.musicSrc) {
      fileSystemService.deleteFile(season.musicSrc);
    }
    if (season.videoSrc) {
      fileSystemService.deleteFile(season.videoSrc);
    }
  }
}
