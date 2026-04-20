import type {
	ContinueWatchingVideoDTO,
	Episode,
	Season,
	Video,
} from "@seerial/domain";
import type { FindOptionsWhere } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { BaseRepository } from "@/api/v1/base-repository/BaseRepository";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import type { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { librariesRepo } from "@/api/v1/shared/infrastructure/adapters/di/container";
import { GenericRepositoryHelper } from "@/helpers/GenericRepositoryHelper";
import type { WatchListRepositoryPort } from "../../../application/ports/WatchListRepositoryPort";
import type { WatchList } from "../../../domain/WatchList";
import { WatchListModel } from "../models/WatchListModel";

export class WatchListRepositoryImpl
	extends BaseRepository
	implements WatchListRepositoryPort {
	// Generic helper for common CRUD operations
	private helper: GenericRepositoryHelper<WatchListModel, WatchList>;

	constructor() {
		super();

		// Initialize helper
		this.helper = new GenericRepositoryHelper(WatchListModel, {
			entityName: "WatchList",
			generateShortId: true,
		});
	}

	async findByVideoId(videoId: string): Promise<WatchList | null> {
		const validatedId = this.validateId(videoId, "Video ID");
		return this.helper.findByField("videoId", validatedId);
	}

	async findByVideoIdAndUserId(
		videoId: string,
		userId: string,
	): Promise<WatchList | null> {
		const { videoId: vId, userId: uId } = this.validateIds({ videoId, userId });

		const watchList = await WatchListModel.findOne({
			where: { videoId: vId, userId: uId },
		});

		return watchList as unknown as WatchList | null;
	}

	async findById(id: string): Promise<WatchList | null> {
		const validatedId = this.validateId(id, "WatchList ID");
		return this.helper.findById(validatedId);
	}

	async findCurrentSeason(
		seriesId: string,
		userId?: string,
	): Promise<Season | null> {
		const validatedSeriesId = this.validateId(seriesId, "Series ID");
		const validatedUserId = userId
			? this.validateId(userId, "User ID")
			: undefined;

		// const seasons = await SeasonModel.find({
		// 	where: { seriesId: validatedSeriesId },
		// 	relations: ["episodes", "episodes.video", "episodes.video.watchLists"],
		// 	order: { seasonNumber: "DESC" },
		// });

		// QueryBuilder test to optimize the query and avoid loading unnecessary data
		const qb = SeasonModel.createQueryBuilder("season")
			.leftJoinAndSelect("season.episodes", "episode")
			.leftJoinAndSelect("episode.video", "video")
			.leftJoinAndSelect(
				"video.watchLists",
				"wl",
				validatedUserId ? "wl.userId = :userId" : "1=1",
				validatedUserId ? { userId: validatedUserId } : {},
			)
			.where("season.seriesId = :seriesId", { seriesId: validatedSeriesId })
			.orderBy("season.seasonNumber", "DESC");

		const seasons = await qb.getMany();

		if (seasons.length === 0) return null;

		// Find the current season in reverse order
		const currentSeason = seasons.find((season) =>
			season.episodes.some((episode) => {
				const watchList = episode.video?.watchLists?.find(
					(wl) => !validatedUserId || wl.userId === validatedUserId,
				);
				return watchList && (watchList.watched || watchList.timeWatched > 0);
			}),
		);

		// Return the first season as a fallback
		return (currentSeason ?? seasons.at(-1)) as unknown as Season;
	}

	async findCurrentEpisode(
		seasonId: string,
		userId?: string,
	): Promise<Episode | null> {
		const validatedSeasonId = this.validateId(seasonId, "Season ID");
		const validatedUserId = userId
			? this.validateId(userId, "User ID")
			: undefined;

		const season = await SeasonModel.findOne({
			where: { id: validatedSeasonId },
			relations: ["episodes", "episodes.video", "episodes.video.watchLists"],
		});

		if (!season?.episodes.length) return null;

		const orderedEpisodes = [...season.episodes].sort(
			(a, b) => a.episodeNumber - b.episodeNumber,
		);

		const inProgress = orderedEpisodes
			.map((episode) => {
				const watchList = episode.video?.watchLists?.find(
					(wl) => !validatedUserId || wl.userId === validatedUserId,
				);
				return { episode, watchList };
			})
			.filter(
				({ watchList }) =>
					!!watchList && !watchList.watched && watchList.timeWatched > 0,
			)
			.sort(
				(a, b) =>
					(b.watchList?.timeWatched ?? 0) - (a.watchList?.timeWatched ?? 0),
			)[0]?.episode;

		if (inProgress) {
			return inProgress as unknown as Episode;
		}

		const nextToWatch = orderedEpisodes.find((episode) => {
			const watchList = episode.video?.watchLists?.find(
				(wl) => !validatedUserId || wl.userId === validatedUserId,
			);

			return !watchList?.watched;
		});

		return (nextToWatch ??
			orderedEpisodes[orderedEpisodes.length - 1]) as unknown as Episode;
	}

	async findCurrentVideo(
		movieId: string,
		userId?: string,
	): Promise<Video | null> {
		const validatedMovieId = this.validateId(movieId, "Movie ID");
		const validatedUserId = userId
			? this.validateId(userId, "User ID")
			: undefined;

		const movie = await MovieModel.findOne({
			where: { id: validatedMovieId },
			relations: ["videos", "videos.watchLists"],
		});

		if (!movie?.videos.length) return null;

		const orderedVideos = [...movie.videos].sort((a, b) => {
			const titleCompare = (a.title ?? "").localeCompare(b.title ?? "");
			return titleCompare !== 0 ? titleCompare : a.id.localeCompare(b.id);
		});

		const inProgress = orderedVideos
			.map((video) => {
				const watchList = video.watchLists?.find(
					(wl) => !validatedUserId || wl.userId === validatedUserId,
				);
				return { video, watchList };
			})
			.filter(
				({ watchList }) =>
					!!watchList && !watchList.watched && watchList.timeWatched > 0,
			)
			.sort(
				(a, b) =>
					(b.watchList?.timeWatched ?? 0) - (a.watchList?.timeWatched ?? 0),
			)[0]?.video;

		if (inProgress) {
			return inProgress as unknown as Video;
		}

		const nextToWatch = orderedVideos.find((video) => {
			const watchList = video.watchLists?.find(
				(wl) => !validatedUserId || wl.userId === validatedUserId,
			);

			return !watchList?.watched;
		});

		if (nextToWatch) {
			return nextToWatch as unknown as Video;
		}

		return orderedVideos[0] as unknown as Video;
	}

	async create(data: WatchList): Promise<WatchList> {
		this.validateData(data, "WatchList data");

		// If the record already exists for the same unique pair (e.g., videoId+userId), return it
		const where: FindOptionsWhere<WatchListModel> = { userId: data.userId };
		if (data.videoId) where.videoId = data.videoId;
		if (data.movieId) where.movieId = data.movieId;
		if (data.episodeId) where.episodeId = data.episodeId;
		if (data.seasonId) where.seasonId = data.seasonId;
		if (data.seriesId) where.seriesId = data.seriesId;

		const existing = await WatchListModel.findOne({ where });
		if (existing) return existing as unknown as WatchList;

		const dataToCreate = {
			...data,
			id: data.id || uuidv4().split("-")[0],
		};

		return this.helper.create(dataToCreate, true);
	}

	async update(id: string, data: Partial<WatchList>): Promise<WatchList> {
		const validatedId = this.validateId(id, "WatchList item ID");
		this.validateData(data, "Update data");
		return this.helper.update(validatedId, data);
	}

	async delete(id: string): Promise<void> {
		const validatedId = this.validateId(id, "WatchList item ID");
		return this.helper.delete(validatedId);
	}

	async addSeries(userId: string, seriesId: string): Promise<void> {
		const { userId: uId, seriesId: sId } = this.validateIds({
			userId,
			seriesId,
		});

		const existing = await WatchListModel.findOne({
			where: { userId: uId, seriesId: sId },
		});
		if (existing) {
			if (!existing.watched) {
				existing.watched = true;
				await existing.save();
			}
			return;
		}

		const newWatchListData = {
			userId: uId,
			seriesId: sId,
			watched: true,
		};

		await this.helper.create(newWatchListData, true);
	}

	async removeSeries(userId: string, seriesId: string): Promise<boolean> {
		const { userId: uId, seriesId: sId } = this.validateIds({
			userId: String(userId),
			seriesId: String(seriesId),
		});

		const whereCondition = {
			userId: uId,
			seriesId: sId,
		};

		const result = await WatchListModel.delete(whereCondition);
		return (result.affected ?? 0) > 0;
	}

	async addSeason(userId: string, seasonId: string): Promise<void> {
		const { userId: uId, seasonId: seId } = this.validateIds({
			userId,
			seasonId,
		});

		const existing = await WatchListModel.findOne({
			where: { userId: uId, seasonId: seId },
		});
		if (existing) {
			if (!existing.watched) {
				existing.watched = true;
				await existing.save();
			}
			return;
		}

		const newWatchListData = {
			userId: uId,
			seasonId: seId,
			watched: true,
		};

		await this.helper.create(newWatchListData, true);
	}

	async removeSeason(userId: string, seasonId: string): Promise<boolean> {
		const { userId: uId, seasonId: seId } = this.validateIds({
			userId: String(userId),
			seasonId: String(seasonId),
		});

		const whereCondition = {
			userId: uId,
			seasonId: seId,
		};

		const result = await WatchListModel.delete(whereCondition);
		return (result.affected ?? 0) > 0;
	}

	async addEpisode(userId: string, episodeId: string): Promise<void> {
		const { userId: uId, episodeId: eId } = this.validateIds({
			userId,
			episodeId,
		});

		const existing = await WatchListModel.findOne({
			where: { userId: uId, episodeId: eId },
		});
		if (existing) {
			if (!existing.watched) {
				existing.watched = true;
				await existing.save();
			}
			return;
		}

		const newWatchListData = {
			userId: uId,
			episodeId: eId,
			watched: true,
		};

		await this.helper.create(newWatchListData, true);
	}

	async removeEpisode(userId: string, episodeId: string): Promise<boolean> {
		const { userId: uId, episodeId: eId } = this.validateIds({
			userId: String(userId),
			episodeId: String(episodeId),
		});

		const whereCondition = {
			userId: uId,
			episodeId: eId,
		};

		const result = await WatchListModel.delete(whereCondition);
		return (result.affected ?? 0) > 0;
	}

	async addMovie(userId: string, movieId: string): Promise<void> {
		const { userId: uId, movieId: mId } = this.validateIds({ userId, movieId });

		const existing = await WatchListModel.findOne({
			where: { userId: uId, movieId: mId },
		});
		if (existing) {
			if (!existing.watched) {
				existing.watched = true;
				await existing.save();
			}
			return;
		}

		const newWatchListData = {
			userId: uId,
			movieId: mId,
			watched: true,
		};

		await this.helper.create(newWatchListData, true);
	}

	async removeMovie(userId: string, movieId: string): Promise<boolean> {
		const { userId: uId, movieId: mId } = this.validateIds({
			userId: String(userId),
			movieId: String(movieId),
		});

		const whereCondition = {
			userId: uId,
			movieId: mId,
		};

		const result = await WatchListModel.delete(whereCondition);
		return (result.affected ?? 0) > 0;
	}

	async addVideo(userId: string, videoId: string): Promise<void> {
		const { userId: uId, videoId: vId } = this.validateIds({ userId, videoId });

		const existing = await WatchListModel.findOne({
			where: { userId: uId, videoId: vId },
		});
		if (existing) {
			if (!existing.watched) {
				existing.watched = true;
				await existing.save();
			}
			return;
		}

		const newWatchListData = {
			userId: uId,
			videoId: vId,
			watched: true,
		};

		await this.helper.create(newWatchListData, true);
	}

	async removeVideo(userId: string, videoId: string): Promise<boolean> {
		const { userId: uId, videoId: vId } = this.validateIds({
			userId: String(userId),
			videoId: String(videoId),
		});

		const whereCondition = {
			userId: uId,
			videoId: vId,
		};

		const result = await WatchListModel.delete(whereCondition);
		return (result.affected ?? 0) > 0;
	}

	async isVideoWatched(videoId: string, userId: string): Promise<boolean> {
		const { userId: uId, videoId: vId } = this.validateIds({
			userId: String(userId),
			videoId: String(videoId),
		});

		const existing = await WatchListModel.findOne({
			where: { userId: uId, videoId: vId, watched: true },
		});
		return existing !== null;
	}

	async isSeriesWatched(seriesId: string, userId: string): Promise<boolean> {
		const { userId: uId, seriesId: sId } = this.validateIds({
			userId: String(userId),
			seriesId: String(seriesId),
		});

		const existing = await WatchListModel.findOne({
			where: { userId: uId, seriesId: sId, watched: true },
		});
		return existing !== null;
	}

	async isMovieWatched(movieId: string, userId: string): Promise<boolean> {
		const { userId: uId, movieId: mId } = this.validateIds({
			userId: String(userId),
			movieId: String(movieId),
		});

		const existing = await WatchListModel.findOne({
			where: { userId: uId, movieId: mId, watched: true },
		});
		return existing !== null;
	}

	async isSeasonWatched(seasonId: string, userId: string): Promise<boolean> {
		const { userId: uId, seasonId: sId } = this.validateIds({
			userId: String(userId),
			seasonId: String(seasonId),
		});

		const existing = await WatchListModel.findOne({
			where: { userId: uId, seasonId: sId, watched: true },
		});
		return existing !== null;
	}

	async isEpisodeWatched(episodeId: string, userId: string): Promise<boolean> {
		const { userId: uId, episodeId: eId } = this.validateIds({
			userId: String(userId),
			episodeId: String(episodeId),
		});

		const existing = await WatchListModel.findOne({
			where: { userId: uId, episodeId: eId, watched: true },
		});
		return existing !== null;
	}

	async getContinueWatchingVideos(
		userId: string,
	): Promise<ContinueWatchingVideoDTO[]> {
		const validatedUserId = this.validateId(userId, "User ID");

		const elements = await WatchListModel.find({
			where: { userId: validatedUserId, watched: false },
			relations: [
				"video",
				"video.episode",
				"video.episode.season",
				"video.episode.season.series",
				"video.movie",
			],
			order: { updatedAt: "DESC" },
		});

		const videos = await Promise.all(
			elements
				.filter(
					(item) =>
						!!item.video &&
						(item.timeWatched > 0 || !!item.seriesId || !!item.movieId),
				)
				.map(async (item) => await this.mapContinueWatchingVideo(item)),
		);

		return videos.filter(
			(video): video is ContinueWatchingVideoDTO => video !== null,
		);
	}

	private async mapContinueWatchingVideo(
		item: WatchListModel,
	): Promise<ContinueWatchingVideoDTO | null> {
		const itemVideo = item.video;
		if (!itemVideo) return null;

		if (itemVideo.episode?.season?.series) {
			const episode = itemVideo.episode;
			const season = episode.season;
			const series = season.series;

			return {
				id: item.id,
				title: series.name ?? "Not found",
				subtitle: episode.name,
				episodeNumber: episode.episodeNumber ?? 0,
				seasonNumber: episode.seasonNumber ?? 0,
				date: episode.year ?? "",
				duration: itemVideo.runtime ?? 0,
				timeWatched: item.timeWatched ?? 0,
				genres: series.genres ?? [],
				overview: episode.overview ?? season.overview ?? series.overview ?? "",
				backgroundImage: season.backgroundSrc,
				posterImage: series.coverSrc,
				logoImage: series.logoSrc,
				videoImage: itemVideo.imgSrc,
				episodeId: episode.id,
				seriesId: series.id,
				videoId: itemVideo.id,
				details: await librariesRepo.generateItemDetails(
					series as unknown as SeriesModel,
					"series",
					item.userId,
				),
			};
		}

		if (itemVideo.movie) {
			const movie = itemVideo.movie;

			return {
				id: item.id,
				title: movie.name ?? "Not found",
				date: movie.year ?? "",
				duration: itemVideo.runtime ?? 0,
				timeWatched: item.timeWatched ?? 0,
				genres: movie.genres ?? [],
				overview: movie.overview,
				backgroundImage: movie.backgroundSrc,
				posterImage: movie.coverSrc,
				logoImage: movie.logoSrc,
				videoImage: itemVideo.imgSrc,
				movieId: movie.id,
				videoId: itemVideo.id,
				details: await librariesRepo.generateItemDetails(
					movie as unknown as MovieModel,
					"movie",
					item.userId,
				),
			};
		}

		return null;
	}

	async addContinueWatchingVideo(
		videoId: string,
		userId: string,
		seriesId?: string,
		movieId?: string,
	): Promise<WatchList> {
		const validated = this.validateIds({ videoId, userId });
		const validatedSeriesId = seriesId
			? this.validateId(seriesId, "Series ID")
			: undefined;
		const validatedMovieId = movieId
			? this.validateId(movieId, "Movie ID")
			: undefined;

		if (validatedSeriesId || validatedMovieId) {
			await this.clearContinueWatching(
				validated.userId,
				validatedSeriesId,
				validatedMovieId,
			);
		}

		const existing = await WatchListModel.findOne({
			where: { userId: validated.userId, videoId: validated.videoId },
		});

		if (existing) {
			existing.watched = false;
			if (validatedSeriesId) existing.seriesId = validatedSeriesId;
			if (validatedMovieId) existing.movieId = validatedMovieId;
			return (await existing.save()) as unknown as WatchList;
		}

		const dataToCreate = {
			id: uuidv4().split("-")[0],
			userId: validated.userId,
			videoId: validated.videoId,
			seriesId: validatedSeriesId,
			movieId: validatedMovieId,
			watched: false,
			timeWatched: 0,
			lastWatched: "",
		};

		return this.helper.create(dataToCreate, true);
	}

	async removeContinueWatchingVideo(
		videoId: string,
		userId?: string,
	): Promise<void> {
		const validatedVideoId = this.validateId(videoId, "Video ID");

		const whereCondition: Record<string, string | boolean> = {
			videoId: validatedVideoId,
			watched: false,
		};

		if (userId) {
			whereCondition.userId = this.validateId(userId, "User ID");
		}

		await WatchListModel.delete(whereCondition);
	}

	async clearContinueWatching(
		userId: string,
		seriesId?: string,
		movieId?: string,
	): Promise<boolean> {
		const validatedUserId = this.validateId(userId, "User ID");

		if (!seriesId && !movieId) {
			return false;
		}

		const whereCondition: Record<string, string | boolean> = {
			userId: validatedUserId,
			watched: false,
		};

		if (seriesId) {
			whereCondition.seriesId = this.validateId(seriesId, "Series ID");
		}

		if (movieId) {
			whereCondition.movieId = this.validateId(movieId, "Movie ID");
		}

		const result = await WatchListModel.delete(whereCondition);
		return (result.affected || 0) > 0;
	}
}
