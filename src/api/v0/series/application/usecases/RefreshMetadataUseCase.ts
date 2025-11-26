import { MetadataManager } from "@/managers/MetadataManager";

/**
 * Refreshes all the metadata of an existing series, including all its seasons and episodes.
 * It does not re-scan the files, it only uses the existing themdbId.
 * * @param seriesId The ID of the series in the local database.
 */
export class RefreshMetadataUseCase {
  constructor() {}

  async execute(seriesId: string): Promise<void> {
    const series = await getSeriesById(seriesId);
    if (!series) {
      console.error(`[Updater] Show not found: ${seriesId}`);
      return;
    }

    const library = await getLibraryById(series.libraryId);
    if (!library) {
      console.error(`[Updater] Library not found for show: ${series.name}`);
      return;
    }

    try {
      // Update UI
      series.analyzingFiles = true;
      await series.save();
      getNotificationService().mutateSeries(series);

      // Update show metadata
      await MetadataManager.updateSeriesMetadata(series, library.language);

      // Update seasons and episodes metadata
      const seasons = await getSeasons(series.id);
      if (seasons) {
        for (const season of seasons) {
          await MetadataManager.updateSeasonMetadata(season, series);

          // Get season metadata from TMDb
          const seasonTMDb = await MovieDBWrapper.getSeason(
            series.themdbId,
            season.seasonNumber,
            library.language
          );
          if (!seasonTMDb?.episodes) continue;

          const episodes = await getEpisodes(season.id);
          if (episodes) {
            for (const episode of episodes) {
              const episodeTMDb = seasonTMDb.episodes.find(
                (e) => e.episode_number === episode.episodeNumber
              );
              const video = await getVideoByEpisodeId(episode.id);

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
      await series.save();
      getNotificationService().mutateSeries(series);
      getNotificationService().mutateSeason();
      getNotificationService().mutateLibrary(library.id);
    }
  }
}
