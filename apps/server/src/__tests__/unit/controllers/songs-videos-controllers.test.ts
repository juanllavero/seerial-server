import type { Request } from "express";
import { SongsController } from "@/api/v1/songs/infrastructure/web/controllers/SongsController";
import { VideosController } from "@/api/v1/videos/infrastructure/web/controllers/VideosController";
import { messages } from "@/config/messages";

jest.mock("@/api/v1/shared/infrastructure/adapters/di/container", () => ({
	useCases: {
		updateSong: jest.fn(),
		deleteSong: jest.fn(),
		getSongById: jest.fn(),
		startSongStemSeparation: jest.fn(),
		getVideoById: jest.fn(),
		getVideoByEpisodeId: jest.fn(),
		getVideoPlaybackInfo: jest.fn(),
		updateVideo: jest.fn(),
		deleteVideo: jest.fn(),
		updateMediaInfo: jest.fn(),
		addVideoToWatchList: jest.fn(),
		removeVideoFromWatchList: jest.fn(),
	},
	fileSystemService: {
		dirname: jest.fn(),
		basename: jest.fn(),
		extname: jest.fn(),
		join: jest.fn(),
		getExternalPath: jest.fn(),
		isFolder: jest.fn(),
		getValidMusicFiles: jest.fn(),
		writeFile: jest.fn(),
	},
	audioProcessingService: {
		getStreamableAudioPath: jest.fn(),
		streamFile: jest.fn(),
	},
	videoExtractionService: {
		streamVideoThumbnail: jest.fn().mockResolvedValue(undefined),
		streamVideoSubtitles: jest.fn().mockResolvedValue(undefined),
	},
}));

jest.mock(
	"@/api/v1/shared/infrastructure/services/MediaDetailsService",
	() => ({
		findLyricsForSong: jest.fn(),
	}),
);

jest.mock("@/middleware/audio.middleware", () => ({
	verifyAudioStreamToken: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
	sign: jest.fn().mockReturnValue("mock-token"),
}));

const container = jest.requireMock(
	"@/api/v1/shared/infrastructure/adapters/di/container",
);
const { findLyricsForSong } = jest.requireMock(
	"@/api/v1/shared/infrastructure/services/MediaDetailsService",
);
const { verifyAudioStreamToken } = jest.requireMock(
	"@/middleware/audio.middleware",
);
const jwt = jest.requireMock("jsonwebtoken");

const asRequest = (value: object) => value as Request;
const uc = (result?: unknown) => ({
	execute: jest.fn().mockResolvedValue(result),
});

describe("SongsController", () => {
	beforeEach(() => jest.clearAllMocks());

	it("updates a song", async () => {
		const updated = { id: "song-1", title: "Updated" };
		container.useCases.updateSong.mockReturnValue(uc(updated));

		const response = await new SongsController().update("song-1", {
			title: "Updated",
		} as never);

		expect(response.data).toEqual(updated);
		expect(response.message).toBe(messages.success.update);
	});

	it("deletes a song", async () => {
		container.useCases.deleteSong.mockReturnValue(uc(undefined));

		const response = await new SongsController().delete("song-1");

		expect(response.message).toBe(messages.success.delete);
		expect(response.data).toBeNull();
	});

	it("starts asynchronous song stem separation", async () => {
		const job = {
			jobId: "job-1",
			songId: "song-1",
			inputPath: "/music/song.flac",
			instrumentalPath: "/music/song.inst.flac",
			vocalsPath: "/music/song.vocals.flac",
			status: "queued",
			message: "Stem separation queued.",
		};
		container.useCases.startSongStemSeparation.mockReturnValue(uc(job));

		const controller = new SongsController();
		const setStatusSpy = jest.spyOn(controller, "setStatus");

		const response = await controller.separateStems("song-1");

		expect(setStatusSpy).toHaveBeenCalledWith(202);
		expect(response.data).toEqual(job);
		expect(response.message).toBe(messages.success.processStarted);
	});

	it("returns song lyrics", async () => {
		const lyrics = [{ content: "[00:00.00] Hello", language: "en" }];
		(findLyricsForSong as jest.Mock).mockResolvedValue(lyrics);

		const response = await new SongsController().getSongsLyrics("song-1");

		expect(response.data).toEqual(lyrics);
		expect(findLyricsForSong).toHaveBeenCalledWith("song-1");
	});

	it("throws not found when song does not exist while adding lyrics", async () => {
		container.useCases.getSongById.mockReturnValue(uc(null));

		await expect(
			new SongsController().addSongsLyrics({
				songId: "missing",
				language: "en",
				content: "[00:00.00] Hi",
			}),
		).rejects.toMatchObject({ statusCode: 404 });
	});

	it("adds song lyrics with language suffix for non-original language", async () => {
		const song = { id: "song-1", fileSrc: "/music/song.mp3" };
		container.useCases.getSongById.mockReturnValue(uc(song));
		container.fileSystemService.dirname.mockReturnValue("/music");
		container.fileSystemService.extname.mockReturnValue(".mp3");
		container.fileSystemService.basename.mockReturnValue("song");
		container.fileSystemService.join.mockReturnValue("/music/song.en.lrc");
		container.fileSystemService.writeFile.mockResolvedValue(undefined);

		const response = await new SongsController().addSongsLyrics({
			songId: "song-1",
			language: "en",
			content: "[00:00.00] Hello",
		});

		expect(response.data).toBe("song.en.lrc");
		expect(container.fileSystemService.writeFile).toHaveBeenCalledWith(
			"/music/song.en.lrc",
			"[00:00.00] Hello",
			"utf-8",
		);
	});

	it('adds song lyrics without language suffix when language is "original"', async () => {
		const song = { id: "song-1", fileSrc: "/music/song.mp3" };
		container.useCases.getSongById.mockReturnValue(uc(song));
		container.fileSystemService.dirname.mockReturnValue("/music");
		container.fileSystemService.extname.mockReturnValue(".mp3");
		container.fileSystemService.basename.mockReturnValue("song");
		container.fileSystemService.join.mockReturnValue("/music/song.lrc");
		container.fileSystemService.writeFile.mockResolvedValue(undefined);

		const response = await new SongsController().addSongsLyrics({
			songId: "song-1",
			language: "original",
			content: "[00:00.00] Hola",
		});

		expect(response.data).toBe("song.lrc");
		expect(container.fileSystemService.join).toHaveBeenCalledWith(
			"/music",
			"song.lrc",
		);
	});

	it("generates a signed song stream URL", async () => {
		const response = await new SongsController().getSongUrl({
			filePath: "/music/song.mp3",
			expiresIn: "5m",
		});

		expect(response.data).toContain("/songs/stream?token=");
		expect(jwt.sign).toHaveBeenCalledWith(
			expect.objectContaining({ path: "/music/song.mp3" }),
			expect.any(String),
			{ expiresIn: "5m" },
		);
	});

	it("resolves localId to the downloaded song file before signing the URL", async () => {
		container.fileSystemService.join.mockReturnValue("resources/music/song-1");
		container.fileSystemService.getExternalPath.mockReturnValue(
			"/data/resources/music/song-1",
		);
		container.fileSystemService.isFolder.mockResolvedValue(true);
		container.fileSystemService.getValidMusicFiles.mockResolvedValue([
			"/data/resources/music/song-1/song-1.opus",
		]);

		await new SongsController().getSongUrl({ filePath: "", localId: "song-1" });

		expect(container.fileSystemService.getValidMusicFiles).toHaveBeenCalledWith(
			"/data/resources/music/song-1",
		);
		expect(jwt.sign).toHaveBeenCalledWith(
			expect.objectContaining({
				path: "/data/resources/music/song-1/song-1.opus",
			}),
			expect.any(String),
			{ expiresIn: "2m" },
		);
	});

	it("returns null when the local song folder does not exist", async () => {
		container.fileSystemService.join.mockReturnValue(
			"resources/music/song-missing",
		);
		container.fileSystemService.getExternalPath.mockReturnValue(
			"/data/resources/music/song-missing",
		);
		container.fileSystemService.isFolder.mockResolvedValue(false);

		const response = await new SongsController().getSongUrl({
			filePath: "",
			localId: "song-missing",
		});

		expect(response.data).toBeNull();
		expect(jwt.sign).not.toHaveBeenCalled();
	});

	it("returns null when the local song folder has no valid audio file", async () => {
		container.fileSystemService.join.mockReturnValue(
			"resources/music/song-empty",
		);
		container.fileSystemService.getExternalPath.mockReturnValue(
			"/data/resources/music/song-empty",
		);
		container.fileSystemService.isFolder.mockResolvedValue(true);
		container.fileSystemService.getValidMusicFiles.mockResolvedValue([]);

		const response = await new SongsController().getSongUrl({
			filePath: "",
			localId: "song-empty",
		});

		expect(response.data).toBeNull();
		expect(jwt.sign).not.toHaveBeenCalled();
	});

	it("includes optional query params in the signed song URL", async () => {
		const response = await new SongsController().getSongUrl(
			{ filePath: "/music/song.mp3" },
			"true",
			undefined,
			"true",
		);

		expect(response.data).toContain("isWeb=true");
		expect(response.data).toContain("isMobile=true");
		expect(response.data).not.toContain("isDesktop");
	});

	it("propagates middleware errors in streamAudio", async () => {
		(verifyAudioStreamToken as jest.Mock).mockImplementation(
			(_req, _res, next) => next(new Error("Invalid token")),
		);

		const req = { res: {}, audioParams: { path: "/song.mp3" } } as never;

		await expect(new SongsController().streamAudio(req)).rejects.toThrow(
			"Invalid token",
		);
	});

	it("streams audio when token is valid", async () => {
		(verifyAudioStreamToken as jest.Mock).mockImplementation(
			(_req, _res, next) => next(),
		);
		container.audioProcessingService.getStreamableAudioPath.mockResolvedValue(
			"/processed/song.mp3",
		);
		container.audioProcessingService.streamFile.mockReturnValue(undefined);

		const req = { res: {}, audioParams: { path: "/song.mp3" } } as never;

		await new SongsController().streamAudio(req);

		expect(
			container.audioProcessingService.getStreamableAudioPath,
		).toHaveBeenCalledWith("/song.mp3", false);
		expect(container.audioProcessingService.streamFile).toHaveBeenCalledWith(
			"/processed/song.mp3",
			req,
			{},
		);
	});
});

describe("VideosController", () => {
	beforeEach(() => jest.clearAllMocks());

	it("returns video by id", async () => {
		const video = { id: "vid-1", title: "Pilot" };
		container.useCases.getVideoById.mockReturnValue(uc(video));

		const response = await new VideosController().get("vid-1");

		expect(response.data).toEqual(video);
	});

	it("throws not found when video does not exist in get", async () => {
		container.useCases.getVideoById.mockReturnValue(uc(null));

		await expect(new VideosController().get("missing")).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("returns video by episode id", async () => {
		const video = { id: "vid-1" };
		container.useCases.getVideoByEpisodeId.mockReturnValue(uc(video));

		const response = await new VideosController().getByEpisodeId("ep-1");

		expect(response.data).toEqual(video);
	});

	it("throws not found when video by episode id does not exist", async () => {
		container.useCases.getVideoByEpisodeId.mockReturnValue(uc(null));

		await expect(
			new VideosController().getByEpisodeId("ep-missing"),
		).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("returns video playback info", async () => {
		const info = { videoId: "vid-1", duration: 3600 };
		container.useCases.getVideoPlaybackInfo.mockReturnValue(uc(info));

		const response = await new VideosController().getPlaybackInfo("vid-1");

		expect(response.data).toEqual(info);
	});

	it("throws not found when playback info does not exist", async () => {
		container.useCases.getVideoPlaybackInfo.mockReturnValue(uc(null));

		await expect(
			new VideosController().getPlaybackInfo("missing"),
		).rejects.toMatchObject({
			statusCode: 404,
		});
	});

	it("updates a video", async () => {
		const updated = { id: "vid-1", title: "Updated" };
		container.useCases.updateVideo.mockReturnValue(uc(updated));

		const response = await new VideosController().update("vid-1", {
			title: "Updated",
		} as never);

		expect(response.data).toEqual(updated);
		expect(response.message).toBe(messages.success.update);
	});

	it("deletes a video", async () => {
		container.useCases.deleteVideo.mockReturnValue(uc(undefined));

		const response = await new VideosController().delete("vid-1");

		expect(response.message).toBe(messages.success.delete);
	});

	it("updates video media info", async () => {
		container.useCases.updateMediaInfo.mockReturnValue(uc(undefined));

		const response = await new VideosController().updateMediaInfo("vid-1");

		expect(response.message).toBe(messages.success.update);
		expect(response.data).toBeNull();
	});

	it("throws 400 when userId is missing in setWatchState", async () => {
		await expect(
			new VideosController().setWatchState(
				"vid-1",
				{ watched: true } as never,
				asRequest({}),
			),
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("throws not found when video does not exist in setWatchState", async () => {
		container.useCases.getVideoById.mockReturnValue(uc(null));

		await expect(
			new VideosController().setWatchState(
				"missing",
				{ watched: true } as never,
				asRequest({ user: { id: "user-1" } } as never),
			),
		).rejects.toMatchObject({ statusCode: 404 });
	});

	it("adds video to watch list when watched=true", async () => {
		const video = { id: "vid-1" };
		container.useCases.getVideoById.mockReturnValue(uc(video));
		container.useCases.addVideoToWatchList.mockReturnValue(uc(undefined));
		container.useCases.updateVideo.mockReturnValue(uc(video));

		await new VideosController().setWatchState(
			"vid-1",
			{ watched: true } as never,
			asRequest({ user: { id: "user-1" } } as never),
		);

		expect(
			container.useCases.addVideoToWatchList().execute,
		).toHaveBeenCalledWith("vid-1", "user-1");
	});

	it("removes video from watch list when watched=false", async () => {
		const video = { id: "vid-1" };
		container.useCases.getVideoById.mockReturnValue(uc(video));
		container.useCases.removeVideoFromWatchList.mockReturnValue(uc(undefined));
		container.useCases.updateVideo.mockReturnValue(uc(video));

		await new VideosController().setWatchState(
			"vid-1",
			{ watched: false, userId: "user-2" } as never,
			asRequest({}),
		);

		expect(
			container.useCases.removeVideoFromWatchList().execute,
		).toHaveBeenCalledWith("vid-1", "user-2");
	});
});
