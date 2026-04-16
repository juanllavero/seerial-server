import type { SeasonsRepositoryPort } from "@/api/v1/seasons/application/ports/SeasonsRepositoryPort";
import type { SeriesRepositoryPort } from "@/api/v1/series/application/ports/SeriesRepositoryPort";
import { NotFoundException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import type { VideoRepositoryPort } from "@/api/v1/videos/application/ports/VideosRepositoryPort";
import type { WatchListRepositoryPort } from "@/api/v1/watch-lists/application/ports/WatchListRepositoryPort";
import { messages } from "@/config/messages";
import type { EpisodeRepositoryPort } from "../ports/EpisodeRepositoryPort";

export class SetEpisodeWatchStateUseCase {
	constructor(
		private episodeRepo: EpisodeRepositoryPort,
		private seasonRepo: SeasonsRepositoryPort,
		private seriesRepo: SeriesRepositoryPort,
		private videoRepo: VideoRepositoryPort,
		private watchListRepo: WatchListRepositoryPort,
	) {}

	async execute(
		episodeId: string,
		userId: string,
		state: boolean,
	): Promise<void> {
		const context = await this.getContext(episodeId);
		const nextEpisodeId = await this.updateSeasonWatchState(
			context,
			userId,
			state,
		);
		await this.updateContinueWatching(context.series.id, userId, nextEpisodeId);
	}

	private async getContext(episodeId: string) {
		const episodeToUpdate = await this.episodeRepo.findById(episodeId);
		if (!episodeToUpdate)
			throw new NotFoundException(messages.errors.notFound.episode);

		const season = await this.seasonRepo.findById(episodeToUpdate.seasonId);
		if (!season) throw new NotFoundException(messages.errors.notFound.season);

		const series = await this.seriesRepo.findById(season.seriesId, "few");
		if (!series?.seasons)
			throw new NotFoundException(messages.errors.notFound.series);

		const allSeasons = (
			await Promise.all(
				series.seasons.map((s) => this.seasonRepo.findById(s.id, "all")),
			)
		)
			.filter((s) => !!s)
			.sort((a, b) => a.seasonNumber - b.seasonNumber);

		return { episodeToUpdate, season, series, allSeasons };
	}

	private async updateSeasonWatchState(
		context: {
			episodeToUpdate: { id: string; episodeNumber: number };
			season: { seasonNumber: number };
			allSeasons: Array<{
				id: string;
				seasonNumber: number;
				episodes: Array<{ id: string }>;
			}>;
		},
		userId: string,
		state: boolean,
	): Promise<string | null> {
		let nextEpisodeId: string | null = null;

		for (const currentSeason of context.allSeasons) {
			const episodes = await this.getOrderedEpisodes(
				currentSeason.episodes.map((e) => e.id),
			);

			if (currentSeason.seasonNumber < context.season.seasonNumber) {
				await this.applySeasonState(currentSeason.id, episodes, userId, true);
				continue;
			}

			if (currentSeason.seasonNumber > context.season.seasonNumber) {
				await this.applySeasonState(currentSeason.id, episodes, userId, false);
				continue;
			}

			nextEpisodeId = await this.applyCurrentSeasonState(
				currentSeason.id,
				episodes,
				context.episodeToUpdate.episodeNumber,
				userId,
				state,
			);
		}

		return nextEpisodeId;
	}

	private async getOrderedEpisodes(episodeIds: string[]) {
		return (
			await Promise.all(episodeIds.map((id) => this.episodeRepo.findById(id)))
		)
			.filter((episode) => !!episode)
			.sort((a, b) => a.episodeNumber - b.episodeNumber);
	}

	private async applySeasonState(
		seasonId: string,
		episodes: Array<{ id: string }>,
		userId: string,
		watched: boolean,
	): Promise<void> {
		for (const episode of episodes) {
			const video = await this.videoRepo.findByEpisodeId(episode.id);
			if (!video) continue;

			if (watched) {
				await this.watchListRepo.addVideo(userId, video.id);
			} else {
				await this.watchListRepo.removeVideo(userId, video.id);
			}
		}

		if (watched) {
			await this.watchListRepo.addSeason(userId, seasonId);
		} else {
			await this.watchListRepo.removeSeason(userId, seasonId);
		}
	}

	private async applyCurrentSeasonState(
		seasonId: string,
		episodes: Array<{ id: string; episodeNumber: number }>,
		episodeNumberToUpdate: number,
		userId: string,
		state: boolean,
	): Promise<string | null> {
		let nextEpisodeId: string | null = null;
		let allWatchedThisSeason = true;

		for (let i = 0; i < episodes.length; i++) {
			const episode = episodes[i];
			const video = await this.videoRepo.findByEpisodeId(episode.id);
			if (!video) continue;

			if (episode.episodeNumber < episodeNumberToUpdate) {
				await this.watchListRepo.addVideo(userId, video.id);
			} else if (episode.episodeNumber === episodeNumberToUpdate) {
				if (state) {
					await this.watchListRepo.addVideo(userId, video.id);
					nextEpisodeId = i < episodes.length - 1 ? episodes[i + 1].id : null;
				} else {
					nextEpisodeId = episode.id;
				}
			} else {
				await this.watchListRepo.removeVideo(userId, video.id);
			}

			const isWatched = await this.watchListRepo.isVideoWatched(
				video.id,
				userId,
			);
			if (!isWatched) allWatchedThisSeason = false;
		}

		if (allWatchedThisSeason) {
			await this.watchListRepo.addSeason(userId, seasonId);
		} else {
			await this.watchListRepo.removeSeason(userId, seasonId);
		}

		return nextEpisodeId;
	}

	private async updateContinueWatching(
		seriesId: string,
		userId: string,
		nextEpisodeId: string | null,
	): Promise<void> {
		await this.watchListRepo.clearContinueWatching(userId, seriesId);

		if (!nextEpisodeId) {
			await this.watchListRepo.addSeries(userId, seriesId);
			return;
		}

		await this.watchListRepo.removeSeries(userId, seriesId);
		const nextVideo = await this.videoRepo.findByEpisodeId(nextEpisodeId);
		if (nextVideo) {
			await this.watchListRepo.addContinueWatchingVideo(
				nextVideo.id,
				userId,
				seriesId,
			);
		}
	}
}
