import { MetadataProviderPort } from "@/api/v0/shared/application/ports/MetadataProviderPort";
import {
  notificationService,
  useCases,
} from "@/api/v0/shared/infrastructure/adapters/di/container";
import { MetadataManager } from "@/managers/MetadataManager";

/**
 * Refreshes all the metadata of an existing series, including all its seasons and episodes.
 * It does not re-scan the files, it only uses the existing themdbId.
 * * @param seriesId The ID of the series in the local database.
 */
export class RefreshMetadataUseCase {
  constructor(private readonly metadataProvider: MetadataProviderPort) {}

  async execute(seriesId: string): Promise<void> {
    const series = await useCases.getSeriesById().execute(seriesId);
    if (!series) {
      console.error(`[Updater] Show not found: ${seriesId}`);
      return;
    }

    const library = await useCases.getLibrary().execute(series.libraryId);
    if (!library) {
      console.error(`[Updater] Library not found for show: ${series.name}`);
      return;
    }

    try {
      // Update UI
      series.analyzingFiles = true;
      await useCases.updateSeries().execute(series.id, series);
      notificationService.mutateSeries(series);

      // Update show metadata
      await MetadataManager.updateSeriesMetadata(series, library.language);

      // Update seasons and episodes metadata
      const seasons = await useCases.getSeasons().execute(series.id);
      if (seasons) {
        for (const season of seasons) {
          await MetadataManager.updateSeasonMetadata(season, series);

          // Get season metadata from TMDb
          const seasonTMDb = await this.metadataProvider.getSeason(
            series.themdbId,
            season.seasonNumber,
            library.language
          );
          if (!seasonTMDb?.episodes) continue;

          const episodes = await useCases
            .getEpisodesBySeasonId()
            .execute(season.id);
          if (episodes) {
            for (const episode of episodes) {
              const episodeTMDb = seasonTMDb.episodes.find(
                (e) => e.episode_number === episode.episodeNumber
              );
              const video = await useCases
                .getVideoByEpisodeId()
                .execute(episode.id);

              if (episodeTMDb && video) {
                await MetadataManager.updateEpisodeMetadata(
                  episode,
                  video,
                  series,
                  episodeTMDb
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`[Updater] Error refreshing show "${series.name}":`, error);
    } finally {
      // Update UI
      series.analyzingFiles = false;
      await useCases.updateSeries().execute(series.id, series);
      notificationService.mutateSeries(series);
      notificationService.mutateSeason();
      notificationService.mutateLibrary(library.id);
    }
  }
}
