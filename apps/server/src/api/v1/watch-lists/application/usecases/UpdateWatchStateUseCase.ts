import type { Video } from "@seerial/domain";
import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import {
	BadRequestException,
	NotFoundException,
} from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { messages } from "@/config/messages";
import type { WatchList } from "../../domain/WatchList";
import type { WatchListRepositoryPort } from "../ports/WatchListRepositoryPort";

export class UpdateWatchStateUseCase {
	constructor(private watchListRepo: WatchListRepositoryPort) {}

	async execute(params: {
		videoId: string;
		timeWatched: number;
		watched: boolean;
		userId: string;
	}): Promise<void> {
		const { videoId, timeWatched, watched, userId } = params;

		if (videoId == null || timeWatched == null || watched == null || !userId) {
			throw new BadRequestException(messages.errors.validation.notEnoughParams);
		}

		const video = await useCases.getVideoById().execute(videoId);
		if (!video) throw new NotFoundException(messages.errors.notFound.video);

		try {
			if (video.episodeId) {
				await this.handleEpisodeWatchState(video, userId, watched);
			} else if (video.movieId) {
				await this.handleMovieWatchState(video, userId, watched);
			}
		} catch (error) {
			// Compatibility guard for older relationship-delete behavior on playback start.
			if (!watched && this.isDeleteRelationshipError(error)) {
				await this.ensureContinueWatching(video, userId);
			} else {
				throw error;
			}
		}

		await this.persistVideoProgress(videoId, userId, watched, timeWatched);

		// Here we could also persist video progress if needed
	}

	private async handleEpisodeWatchState(
		video: Video,
		userId: string,
		watched: boolean,
	): Promise<void> {
		const episode = await useCases
			.getEpisodeById()
			.execute(video.episodeId as string);
		if (!episode) throw new NotFoundException(messages.errors.notFound.episode);

		const season = await useCases.getSeasonById().execute(episode.seasonId);
		if (!season) throw new NotFoundException(messages.errors.notFound.season);

		if (watched) {
			await useCases.setEpisodeWatchState().execute(episode.id, userId, true);
			return;
		}

		await useCases
			.addVideoToContinueWatching()
			.execute(video.id, userId, season.seriesId);
	}

	private async handleMovieWatchState(
		video: Video,
		userId: string,
		watched: boolean,
	): Promise<void> {
		const movie = await useCases
			.getMoviebyId()
			.execute(video.movieId as string);
		if (!movie) throw new NotFoundException(messages.errors.notFound.movie);

		const allWatched =
			movie.videos.filter((v: Video) =>
				v.id === video.id
					? watched
					: v.watchLists.filter((wl: WatchList) => wl.userId === userId)
							.length > 0,
			).length === movie.videos.length;

		if (allWatched) {
			await this.watchListRepo.addMovie(userId, movie.id);
		} else {
			const movieWatchListExists = await this.watchListRepo.isMovieWatched(
				movie.id,
				userId,
			);
			if (movieWatchListExists) {
				await this.watchListRepo.removeMovie(userId, movie.id);
			}
		}

		if (watched) {
			await useCases
				.removeVideoFromContinueWatching()
				.execute(video.id, userId);
			return;
		}

		await useCases
			.addVideoToContinueWatching()
			.execute(video.id, userId, undefined, movie.id);
	}

	private async persistVideoProgress(
		videoId: string,
		userId: string,
		watched: boolean,
		timeWatched: number,
	): Promise<void> {
		await this.watchListRepo.addVideo(userId, videoId);

		const watchList = await this.watchListRepo.findByVideoIdAndUserId(
			videoId,
			userId,
		);
		if (!watchList) {
			return;
		}

		await this.watchListRepo.update(watchList.id, {
			timeWatched,
			watched,
			lastWatched: new Date().toLocaleString(),
		} as Partial<WatchList>);
	}

	private async ensureContinueWatching(
		video: Video,
		userId: string,
	): Promise<void> {
		if (video.episodeId) {
			const episode = await useCases.getEpisodeById().execute(video.episodeId);
			if (!episode) {
				return;
			}

			const season = await useCases.getSeasonById().execute(episode.seasonId);
			if (!season) {
				return;
			}

			await useCases
				.addVideoToContinueWatching()
				.execute(video.id, userId, season.seriesId);
			return;
		}

		if (video.movieId) {
			await useCases
				.addVideoToContinueWatching()
				.execute(video.id, userId, undefined, video.movieId);
		}
	}

	private isDeleteRelationshipError(error: unknown): boolean {
		return (
			error instanceof Error &&
			error.message.includes("Failed to delete WatchList relationship")
		);
	}
}
