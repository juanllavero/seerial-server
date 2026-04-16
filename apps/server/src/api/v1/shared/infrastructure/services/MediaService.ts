import type { Video } from "@seerial/domain";
import { useCases } from "@/api/v1/shared/infrastructure/adapters/di/container";
import type { WatchList } from "@/api/v1/watch-lists/domain/WatchList";
import { messages } from "@/config/messages";
import { NotFoundException } from "../web/exceptions/HTTPExceptions";

// Interface for the structured video info response
interface FormattedVideoInfo {
	title: string;
	subtitle: string;
	info: string;
	preferAudioLan: string;
	preferSubtitleLan: string;
	subsMode: string;
}

export class MediaService {
	private constructor() {}

	/**
	 * Fetches a video and its related parent entities (Series/Movie, Library)
	 * to construct a formatted information object.
	 * @param videoId - The ID of the video file.
	 * @returns A promise that resolves to a formatted video info object.
	 */
	public static async getFormattedVideoInfo(
		videoId: string,
	): Promise<FormattedVideoInfo> {
		const video = await useCases.getVideoById().execute(videoId);
		if (!video) throw new NotFoundException(messages.errors.notFound.video);

		if (video.episodeId) {
			return MediaService.getEpisodeFormattedInfo(video.episodeId);
		}

		if (video.movieId) {
			return MediaService.getMovieFormattedInfo(video.movieId);
		}

		throw new NotFoundException(messages.errors.notFound.video);
	}

	/**
	 * Counts the number of episodes in a series that a user has not yet watched.
	 * NOTE: This implementation is optimized to avoid N+1 query problems.
	 * @param seriesId - The ID of the series.
	 * @param userId - The ID of the user.
	 * @returns A promise that resolves to the count of remaining episodes.
	 */
	public static async countRemainingEpisodes(
		seriesId: string,
		userId: string,
	): Promise<number> {
		const series = await useCases.getSeriesById().execute(seriesId, "all");
		if (!series) throw new NotFoundException(messages.errors.notFound.series);

		let totalEpisodes = 0;
		let watchedEpisodes = 0;

		for (const season of series.seasons) {
			for (const episode of season.episodes) {
				totalEpisodes++;
				const video = await useCases.getVideoByEpisodeId().execute(episode.id); // This could still be an N+1, ideally getSeriesById should include this data
				if (video?.watchLists.some((wl: WatchList) => wl.userId === userId)) {
					watchedEpisodes++;
				}
			}
		}

		return totalEpisodes - watchedEpisodes;
	}

	/**
	 * Counts the number of videos for a movie that a user has not yet watched.
	 * @param movieId - The ID of the movie.
	 * @param userId - The ID of the user.
	 * @returns A promise that resolves to the count of remaining videos.
	 */
	public static async countRemainingVideos(
		movieId: string,
		userId: string,
	): Promise<number> {
		const movie = await useCases.getMoviebyId().execute(movieId);
		if (!movie) throw new NotFoundException(messages.errors.notFound.movie);

		const watchedCount = movie.videos.filter((video: Video) =>
			video.watchLists.some((wl: WatchList) => wl.userId === userId),
		).length;

		return movie.videos.length - watchedCount;
	}

	private static async getEpisodeFormattedInfo(
		episodeId: string,
	): Promise<FormattedVideoInfo> {
		const episode = await useCases.getEpisodeById().execute(episodeId);
		if (!episode) throw new NotFoundException(messages.errors.notFound.episode);

		const season = await useCases.getSeasonById().execute(episode.seasonId);
		if (!season) throw new NotFoundException(messages.errors.notFound.season);

		const series = await useCases.getSeriesById().execute(season.seriesId);
		if (!series) throw new NotFoundException(messages.errors.notFound.series);

		const library = await useCases.getLibrary().execute(series.libraryId);
		if (!library) throw new NotFoundException(messages.errors.notFound.library);

		return {
			title: series.name,
			subtitle: episode.name,
			info: `S${episode.seasonNumber}E${episode.episodeNumber}`,
			preferAudioLan: series.preferAudioLan || library.preferAudioLan || "",
			preferSubtitleLan: series.preferSubLan || library.preferSubLan || "",
			subsMode: series.subsMode || library.subsMode || "",
		};
	}

	private static async getMovieFormattedInfo(
		movieId: string,
	): Promise<FormattedVideoInfo> {
		const movie = await useCases.getMoviebyId().execute(movieId);
		if (!movie) throw new NotFoundException(messages.errors.notFound.movie);

		const library = await useCases.getLibrary().execute(movie.libraryId);
		if (!library) throw new NotFoundException(messages.errors.notFound.library);

		const year = new Date(movie.year).getFullYear();

		return {
			title: movie.name,
			subtitle: "",
			info: `${year}`,
			preferAudioLan: library.preferAudioLan || "",
			preferSubtitleLan: library.preferSubLan || "",
			subsMode: library.subsMode || "",
		};
	}
}
