import type { MetadataProviderPort } from "@/api/v1/shared/application/ports/MetadataProviderPort";
import {
	notificationService,
	useCases,
} from "@/api/v1/shared/infrastructure/adapters/di/container";
import logger from "@/utils/logger";
import type { Series } from "../../domain/Series";

const refreshMetadataLogger = logger.child({ category: "Refresh Metadata" });

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
			refreshMetadataLogger.error(`Show not found: ${seriesId}`);
			return;
		}

		const library = await useCases.getLibrary().execute(series.libraryId);
		if (!library) {
			refreshMetadataLogger.error(`Library not found for show: ${series.name}`);
			return;
		}

		try {
			await this.setSeriesAnalyzing(series, true);

			// Update show metadata
			await this.metadataProvider.updateSeriesMetadata(
				series,
				library.language,
			);

			// Update seasons and episodes metadata
			await this.refreshSeasonsAndEpisodes(
				series.id,
				series.themdbId,
				library.language,
				series,
			);
		} catch (error) {
			refreshMetadataLogger.error(
				error,
				`Error refreshing show "${series.name}"`,
			);
		} finally {
			await this.setSeriesAnalyzing(series, false);
			notificationService.mutateSeries(series);
			notificationService.mutateSeason();
			notificationService.mutateLibrary(library.id);
		}
	}

	private async setSeriesAnalyzing(
		series: Series,
		analyzing: boolean,
	): Promise<void> {
		series.analyzingFiles = analyzing;
		await useCases.updateSeries().execute(series.id, series);
		notificationService.mutateSeries(series);
	}

	private async refreshSeasonsAndEpisodes(
		seriesId: string,
		themdbId: number,
		language: string,
		series: Series,
	): Promise<void> {
		const seasons = await useCases.getSeasons().execute(seriesId);
		if (!seasons) return;

		for (const season of seasons) {
			await this.metadataProvider.updateSeasonMetadata(season, series);

			const seasonTMDb = await this.metadataProvider.getSeason(
				themdbId,
				season.seasonNumber,
				language,
			);
			if (!seasonTMDb?.episodes) continue;

			const episodes = await useCases
				.getEpisodesBySeasonId()
				.execute(season.id);
			if (!episodes) continue;

			for (const episode of episodes) {
				const episodeTMDb = seasonTMDb.episodes.find(
					(e) => e.episode_number === episode.episodeNumber,
				);
				const video = await useCases.getVideoByEpisodeId().execute(episode.id);

				if (!episodeTMDb || !video) continue;

				await this.metadataProvider.updateEpisodeMetadata(
					episode,
					video,
					series,
					episodeTMDb,
				);
			}
		}
	}
}
