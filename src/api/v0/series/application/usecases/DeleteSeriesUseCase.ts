import { useCases } from "@/api/v0/shared/infrastructure/adapters/di/container";
import { SeriesRepositoryPort } from "../ports/SeriesRepositoryPort";

export class DeleteSeriesUseCase {
  private deleteSeriesData = useCases.deleteSeriesData();
  private deleteSeason = useCases.deleteSeason();
  private getLibrary = useCases.getLibrary();

  constructor(private seriesRepo: SeriesRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const series = await this.seriesRepo.findById(id, "few");
    if (!series) throw new Error(`Series with ID ${id} not found`);

    // Delete seasons
    for (const season of series.seasons || []) {
      await this.deleteSeason.execute(season.id);
    }

    // Delete local media files and folders
    await this.deleteSeriesData.execute(id);

    const library = await this.getLibrary.execute(series.libraryId);

    if (!library) return;

    const removeAnalyzedFolder = useCases.removeAnalyzedFolder();
    await removeAnalyzedFolder.execute(library.id, series.folder);

    await this.seriesRepo.delete(id);
  }
}
