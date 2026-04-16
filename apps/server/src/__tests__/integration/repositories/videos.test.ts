/** biome-ignore-all lint/style/noNonNullAssertion: <Test file> */

import "reflect-metadata";
import { EpisodeModel } from "@/api/v1/episodes/infrastructure/persistence/models/EpisodeModel";
import { LibraryModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryModel";
import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { VideosRepositoryImpl } from "@/api/v1/videos/infrastructure/persistence/repositories/VideosRepositoryImpl";
import { LibraryTypes } from "@/data/interfaces/Media";
import {
	clearAllTables,
	closeTestDataSource,
	getTestDataSource,
} from "../../helpers/test-db";

jest.mock("@/api/v1/shared/infrastructure/adapters/di/container", () => ({
	useCases: {
		getMoviebyId: jest
			.fn()
			.mockReturnValue({ execute: jest.fn().mockResolvedValue(null) }),
		getLibrary: jest
			.fn()
			.mockReturnValue({ execute: jest.fn().mockResolvedValue(null) }),
		getEpisodeById: jest
			.fn()
			.mockReturnValue({ execute: jest.fn().mockResolvedValue(null) }),
		getSeasonById: jest
			.fn()
			.mockReturnValue({ execute: jest.fn().mockResolvedValue(null) }),
		getSeriesById: jest
			.fn()
			.mockReturnValue({ execute: jest.fn().mockResolvedValue(null) }),
		getServerConfig: jest
			.fn()
			.mockReturnValue({ execute: jest.fn().mockResolvedValue(null) }),
	},
	fileSystemService: { getExternalPath: jest.fn().mockReturnValue("/test") },
	mediaInfoService: { getMediaInformation: jest.fn().mockResolvedValue(null) },
}));

// mediaInfo adapter uses ffprobe; avoid real invocations in repository tests
jest.mock("@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo", () => ({
	getMediaInfo: jest.fn().mockResolvedValue(null),
}));

const container = jest.requireMock(
	"@/api/v1/shared/infrastructure/adapters/di/container",
);
const ffmpegMediaInfo = jest.requireMock(
	"@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo",
);

let repo: VideosRepositoryImpl;

beforeAll(async () => {
	await getTestDataSource();
	repo = new VideosRepositoryImpl();
});

afterAll(async () => {
	await closeTestDataSource();
});

beforeEach(async () => {
	jest.clearAllMocks();
	const ds = await getTestDataSource();
	await clearAllTables(ds);
});

async function createMovie() {
	const library = await LibraryModel.save({
		id: `lib-${Math.random().toString(36).slice(2, 10)}`,
		name: "Movies Library",
		type: LibraryTypes.MOVIES,
		language: "en",
		folders: [],
		order: 0,
		hidden: false,
	});

	return MovieModel.save({
		id: `mov-${Math.random().toString(36).slice(2, 10)}`,
		libraryId: library.id,
		name: "Test Movie",
	});
}

async function createEpisodeFixture() {
	const library = await LibraryModel.save({
		id: `lib-${Math.random().toString(36).slice(2, 10)}`,
		name: "Shows Library",
		type: LibraryTypes.SHOWS,
		language: "en",
		folders: [],
		order: 0,
		hidden: false,
	});

	const series = await SeriesModel.save({
		id: `ser-${Math.random().toString(36).slice(2, 10)}`,
		libraryId: library.id,
		name: "Series Test",
		preferAudioLan: "en",
		preferSubLan: "es",
		subsMode: "always",
	});

	const season = await SeasonModel.save({
		id: `sea-${Math.random().toString(36).slice(2, 10)}`,
		seriesId: series.id,
		name: "Season 1",
		seasonNumber: 1,
		order: 0,
	});

	const episode = await EpisodeModel.save({
		id: `epi-${Math.random().toString(36).slice(2, 10)}`,
		seasonId: season.id,
		name: "Episode 1",
		year: "2024",
		seasonNumber: 1,
		episodeNumber: 1,
		order: 0,
	});

	return { library, series, season, episode };
}

describe("VideosRepositoryImpl", () => {
	describe("create / findById", () => {
		it("creates a video with a generated id", async () => {
			const movie = await createMovie();

			const video = await repo.create({
				id: "",
				movieId: movie.id,
				fileSrc: "/movies/test.mp4",
				title: "Test Video",
				runtime: 120,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			expect(video).not.toBeNull();
			expect(video.id).toBeTruthy();
			expect(video.fileSrc).toBe("/movies/test.mp4");
		});

		it("findById returns the video for a valid id", async () => {
			const movie = await createMovie();
			const created = await repo.create({
				movieId: movie.id,
				fileSrc: "/movies/find-me.mp4",
				title: "",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			const found = await repo.findById(created.id);

			expect(found).not.toBeNull();
			expect(found!.fileSrc).toBe("/movies/find-me.mp4");
		});

		it("findById returns null for a non-existent id", async () => {
			const found = await repo.findById("nonexistent");
			expect(found).toBeNull();
		});
	});

	describe("findByMovieId", () => {
		it("returns videos that belong to a movie", async () => {
			const movie = await createMovie();
			await repo.create({
				movieId: movie.id,
				fileSrc: "/movies/a.mp4",
				title: "",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);
			await repo.create({
				movieId: movie.id,
				fileSrc: "/movies/b.mp4",
				title: "",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			const videos = await repo.findByMovieId(movie.id);
			expect(videos).toHaveLength(2);
		});

		it("returns an empty array when the movie has no videos", async () => {
			const movie = await createMovie();
			const videos = await repo.findByMovieId(movie.id);
			expect(videos).toHaveLength(0);
		});
	});

	describe("findByEpisodeId and findByExtraId", () => {
		it("findByEpisodeId returns the matching video", async () => {
			const { episode } = await createEpisodeFixture();
			const created = await repo.create({
				episodeId: episode.id,
				fileSrc: "/shows/episode-1.mkv",
				title: "Episode Video",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			const found = await repo.findByEpisodeId(episode.id);
			expect(found).not.toBeNull();
			expect(found!.id).toBe(created.id);
		});

		it("findByExtraId returns the matching extra video", async () => {
			const movie = await createMovie();
			const created = await repo.addAsMovieExtra(movie.id, {
				fileSrc: "/movies/extra-featurette.mp4",
				title: "Featurette",
			});

			const found = await repo.findByExtraId(movie.id);
			expect(found).not.toBeNull();
			expect(found!.id).toBe(created!.id);
		});
	});

	describe("findByPath", () => {
		it("returns the video matching the file path", async () => {
			const movie = await createMovie();
			await repo.create({
				movieId: movie.id,
				fileSrc: "/movies/unique.mp4",
				title: "",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			const found = await repo.findByPath("/movies/unique.mp4");
			expect(found).not.toBeNull();
			expect(found!.fileSrc).toBe("/movies/unique.mp4");
		});

		it("returns null when no video matches the path", async () => {
			const found = await repo.findByPath("/movies/missing.mp4");
			expect(found).toBeNull();
		});
	});

	describe("update", () => {
		it("updates the video title", async () => {
			const movie = await createMovie();
			const video = await repo.create({
				movieId: movie.id,
				fileSrc: "/movies/update.mp4",
				title: "Old",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			const updated = await repo.update(video.id, { title: "New Title" });

			expect(updated.title).toBe("New Title");
		});

		it("throws for an empty id", async () => {
			await expect(repo.update("", { title: "x" })).rejects.toMatchObject({
				statusCode: 400,
			});
		});
	});

	describe("delete", () => {
		it("deletes the video so it can no longer be found", async () => {
			const movie = await createMovie();
			const video = await repo.create({
				movieId: movie.id,
				fileSrc: "/movies/delete.mp4",
				title: "",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			await repo.delete(video.id);

			const found = await repo.findById(video.id);
			expect(found).toBeNull();
		});
	});

	describe("getVideoPlaybackInfo", () => {
		it("throws when target video is missing", async () => {
			await expect(
				repo.getVideoPlaybackInfo("missing-video"),
			).rejects.toMatchObject({
				statusCode: 404,
			});
		});

		it("throws when movie cannot be resolved", async () => {
			const movie = await createMovie();
			const video = await repo.create({
				movieId: movie.id,
				fileSrc: "/movies/missing-movie-ref.mp4",
				title: "Missing Movie Ref",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			container.useCases.getMoviebyId.mockReturnValue({
				execute: jest.fn().mockResolvedValue(null),
			});

			await expect(repo.getVideoPlaybackInfo(video.id)).rejects.toMatchObject({
				statusCode: 404,
			});
		});

		it("throws when library cannot be resolved for movie context", async () => {
			const movie = await createMovie();
			const video = await repo.create({
				movieId: movie.id,
				fileSrc: "/movies/missing-library-ref.mp4",
				title: "Missing Library Ref",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			container.useCases.getMoviebyId.mockReturnValue({
				execute: jest.fn().mockResolvedValue({
					id: movie.id,
					libraryId: movie.libraryId,
					name: "Movie Name",
					year: "2022",
				}),
			});
			container.useCases.getLibrary.mockReturnValue({
				execute: jest.fn().mockResolvedValue(null),
			});

			await expect(repo.getVideoPlaybackInfo(video.id)).rejects.toMatchObject({
				statusCode: 404,
			});
		});

		it("returns playback info for a movie video when dependencies are available", async () => {
			const movie = await createMovie();
			const video = await repo.create({
				movieId: movie.id,
				fileSrc: "/movies/playback.mp4",
				title: "Playback",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			container.useCases.getMoviebyId.mockReturnValue({
				execute: jest.fn().mockResolvedValue({
					id: movie.id,
					libraryId: movie.libraryId,
					name: "Playback Movie",
					year: "2020",
				}),
			});
			container.useCases.getLibrary.mockReturnValue({
				execute: jest.fn().mockResolvedValue({
					preferAudioLan: "en",
					preferSubLan: "es",
					subsMode: "always",
				}),
			});
			ffmpegMediaInfo.getMediaInfo.mockResolvedValue({
				format: { duration: 100 },
			});

			const info = await repo.getVideoPlaybackInfo(video.id);

			expect(info.title).toBe("Playback Movie");
			expect(info.playBackConfig?.preferAudioLan).toBe("en");
			expect(info.mediaInfoData).toEqual({ format: { duration: 100 } });
		});

		it("throws when media info is missing", async () => {
			const movie = await createMovie();
			const video = await repo.create({
				movieId: movie.id,
				fileSrc: "/movies/no-media-info.mp4",
				title: "No Media",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			container.useCases.getMoviebyId.mockReturnValue({
				execute: jest.fn().mockResolvedValue({
					id: movie.id,
					libraryId: movie.libraryId,
					name: "No Media",
					year: "2021",
				}),
			});
			container.useCases.getLibrary.mockReturnValue({
				execute: jest.fn().mockResolvedValue({}),
			});
			ffmpegMediaInfo.getMediaInfo.mockResolvedValue(null);

			await expect(repo.getVideoPlaybackInfo(video.id)).rejects.toMatchObject({
				statusCode: 404,
			});
		});

		it("returns playback info for an episode video", async () => {
			const { episode, season, series } = await createEpisodeFixture();
			const video = await repo.create({
				episodeId: episode.id,
				fileSrc: "/shows/episode-playback.mkv",
				title: "Episode Playback",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			container.useCases.getEpisodeById.mockReturnValue({
				execute: jest.fn().mockResolvedValue(episode),
			});
			container.useCases.getSeasonById.mockReturnValue({
				execute: jest.fn().mockResolvedValue(season),
			});
			container.useCases.getSeriesById.mockReturnValue({
				execute: jest.fn().mockResolvedValue(series),
			});
			ffmpegMediaInfo.getMediaInfo.mockResolvedValue({
				format: { duration: 50 },
			});

			const info = await repo.getVideoPlaybackInfo(video.id);

			expect(info.title).toBe("Episode 1");
			expect(info.subtitle).toContain("Series Test");
			expect(info.playBackConfig?.preferAudioLan).toBe("en");
		});

		it("throws when episode cannot be resolved in episode context", async () => {
			const { episode } = await createEpisodeFixture();
			const video = await repo.create({
				episodeId: episode.id,
				fileSrc: "/shows/episode-missing-episode.mkv",
				title: "Missing Episode Ref",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			container.useCases.getEpisodeById.mockReturnValue({
				execute: jest.fn().mockResolvedValue(null),
			});

			await expect(repo.getVideoPlaybackInfo(video.id)).rejects.toMatchObject({
				statusCode: 404,
			});
		});

		it("throws when season cannot be resolved in episode context", async () => {
			const { episode } = await createEpisodeFixture();
			const video = await repo.create({
				episodeId: episode.id,
				fileSrc: "/shows/episode-missing-season.mkv",
				title: "Missing Season Ref",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			container.useCases.getEpisodeById.mockReturnValue({
				execute: jest.fn().mockResolvedValue(episode),
			});
			container.useCases.getSeasonById.mockReturnValue({
				execute: jest.fn().mockResolvedValue(null),
			});

			await expect(repo.getVideoPlaybackInfo(video.id)).rejects.toMatchObject({
				statusCode: 404,
			});
		});

		it("throws when series cannot be resolved in episode context", async () => {
			const { episode, season } = await createEpisodeFixture();
			const video = await repo.create({
				episodeId: episode.id,
				fileSrc: "/shows/episode-missing-series.mkv",
				title: "Missing Series Ref",
				runtime: 0,
				hash: "",
				imgSrc: "",
				imgUrls: [],
			} as never);

			container.useCases.getEpisodeById.mockReturnValue({
				execute: jest.fn().mockResolvedValue(episode),
			});
			container.useCases.getSeasonById.mockReturnValue({
				execute: jest.fn().mockResolvedValue(season),
			});
			container.useCases.getSeriesById.mockReturnValue({
				execute: jest.fn().mockResolvedValue(null),
			});

			await expect(repo.getVideoPlaybackInfo(video.id)).rejects.toMatchObject({
				statusCode: 404,
			});
		});
	});

	describe("relationship creation helpers", () => {
		it("creates a video with movie relation through addAsMovie", async () => {
			const movie = await createMovie();

			const created = await repo.addAsMovie(movie.id, {
				fileSrc: "/movies/rel-movie.mp4",
				title: "Relation Movie",
			});

			expect(created).not.toBeNull();
			expect(created!.movieId).toBe(movie.id);
		});

		it("creates a video with movie extra relation through addAsMovieExtra", async () => {
			const movie = await createMovie();

			const created = await repo.addAsMovieExtra(movie.id, {
				fileSrc: "/movies/rel-extra.mp4",
				title: "Relation Extra",
			});

			expect(created).not.toBeNull();
			expect(created!.id).toBe(movie.id);
		});

		it("creates a video with episode relation through addAsEpisode", async () => {
			const { episode } = await createEpisodeFixture();

			const created = await repo.addAsEpisode(episode.id, {
				fileSrc: "/shows/rel-episode.mkv",
				title: "Relation Episode",
			});

			expect(created).not.toBeNull();
			expect(created!.episodeId).toBe(episode.id);
		});
	});
});
