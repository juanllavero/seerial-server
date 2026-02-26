import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { NotFoundException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { SeriesRepositoryPort } from "../ports/SeriesRepositoryPort";

export class DeleteSeriesUseCase {
  constructor(private seriesRepo: SeriesRepositoryPort) {}

  async execute(id: string): Promise<void> {
    const series = await this.seriesRepo.findById(id, "few");
    if (!series) throw new NotFoundException(`Series with ID ${id} not found`);

    // Delete seasons
    for (const season of series.seasons || []) {
      await useCases.deleteSeason().execute(season.id);
    }

    // Delete local media files and folders
    await useCases.deleteSeriesData().execute(id);

    const library = await useCases.getLibrary().execute(series.libraryId);

    if (!library) return;

    const removeAnalyzedFolder = useCases.removeAnalyzedFolder();
    await removeAnalyzedFolder.execute(library.id, series.folder);

    await this.seriesRepo.delete(id);
  }
}
