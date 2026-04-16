import { EventEmitter } from "node:events";
import fs from "node:fs";

const spawnMock = jest.fn();
const execMock = jest.fn();

jest.mock("node:child_process", () => ({
	spawn: (...args: unknown[]) => spawnMock(...args),
	exec: (...args: unknown[]) => execMock(...args),
}));

jest.mock("@/api/v1/shared/infrastructure/adapters/di/container", () => ({
	downloaderService: {
		getYtDlpPath: jest.fn(() => "yt-dlp"),
	},
	fileSystemService: {
		getExternalPath: jest.fn((p: string) => `/ext/${p}`),
		createFolder: jest.fn(),
		join: jest.fn((...parts: string[]) => parts.join("/")),
	},
	notificationService: {
		broadcast: jest.fn(),
	},
}));

import { DownloaderServiceImpl } from "@/api/v1/shared/infrastructure/adapters/downloader/DownloaderServiceImpl";

const container = jest.requireMock(
	"@/api/v1/shared/infrastructure/adapters/di/container",
);

describe("DownloaderServiceImpl", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it("builds yt-dlp path", () => {
		const service = new DownloaderServiceImpl();
		expect(service.getYtDlpPath()).toContain("yt-dlp");
	});

	it("builds download video command through downloadContent", async () => {
		const service = new DownloaderServiceImpl();
		const spy = jest
			.spyOn(service as never, "downloadContent")
			.mockResolvedValue(undefined);

		await service.downloadVideo(
			"https://example.com/v",
			"downloads",
			"video-file",
		);

		expect(spy).toHaveBeenCalled();
		expect(spy.mock.calls[0][1]).toBe("video-file");

		spy.mockRestore();
	});

	it("builds download audio command and creates folder", async () => {
		const service = new DownloaderServiceImpl();
		const spy = jest
			.spyOn(service as never, "downloadContent")
			.mockResolvedValue(undefined);

		await service.downloadAudio("https://example.com/a", "music", "song-file");

		expect(container.fileSystemService.createFolder).toHaveBeenCalled();
		expect(spy).toHaveBeenCalled();
		expect(spy.mock.calls[0][1]).toBe("song-file");

		spy.mockRestore();
	});

	it("logs and continues when deleting existing output files fails", async () => {
		const service = new DownloaderServiceImpl();
		const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(true);
		const unlinkSpy = jest.spyOn(fs, "unlinkSync").mockImplementation(() => {
			throw new Error("unlink failed");
		});
		const contentSpy = jest
			.spyOn(service as never, "downloadContent")
			.mockResolvedValue(undefined);

		await service.downloadVideo(
			"https://example.com/v",
			"downloads",
			"video-file",
		);
		await service.downloadAudio("https://example.com/a", "music", "song-file");

		expect(contentSpy).toHaveBeenCalledTimes(2);

		existsSpy.mockRestore();
		unlinkSpy.mockRestore();
		contentSpy.mockRestore();
	});

	it("auto-downloads first audio result when available", async () => {
		const service = new DownloaderServiceImpl();
		jest.spyOn(service, "searchVideos").mockResolvedValue([
			{
				id: "1",
				title: "x",
				url: "https://example.com/a",
				duration: 10,
				thumbnail: "",
			},
		]);
		const audioSpy = jest
			.spyOn(service, "downloadAudio")
			.mockResolvedValue(undefined);

		await service.autoDownloadFirstAudioResult("query", "element-1");

		expect(audioSpy).toHaveBeenCalledWith(
			"https://example.com/a",
			expect.any(String),
			"element-1",
		);
	});

	it("does nothing when auto-download has no search results", async () => {
		const service = new DownloaderServiceImpl();
		jest.spyOn(service, "searchVideos").mockResolvedValue([]);
		const audioSpy = jest
			.spyOn(service, "downloadAudio")
			.mockResolvedValue(undefined);

		await service.autoDownloadFirstAudioResult("query", "element-1");

		expect(audioSpy).not.toHaveBeenCalled();
	});

	it("broadcasts completion and error events from spawned process", async () => {
		const service = new DownloaderServiceImpl();

		const processEmitter = new EventEmitter() as EventEmitter & {
			stdout: EventEmitter;
			stderr: EventEmitter;
		};
		processEmitter.stdout = new EventEmitter();
		processEmitter.stderr = new EventEmitter();

		spawnMock.mockReturnValue(processEmitter);

		await (service as never).downloadContent("yt-dlp cmd", "media-file");

		processEmitter.stdout.emit("data", Buffer.from("50.0%"));
		processEmitter.stderr.emit(
			"data",
			Buffer.from("WARNING: test\nERROR: test-error\ninfo line"),
		);
		processEmitter.emit("close", 0);
		processEmitter.emit("close", 1);

		expect(container.notificationService.broadcast).toHaveBeenCalledWith(
			expect.stringContaining("DOWNLOAD_PROGRESS"),
		);
		expect(container.notificationService.broadcast).toHaveBeenCalledWith(
			expect.stringContaining("DOWNLOAD_COMPLETE"),
		);
		expect(container.notificationService.broadcast).toHaveBeenCalledWith(
			expect.stringContaining("DOWNLOAD_ERROR"),
		);
	});

	it("returns parsed search results from yt-dlp json output", async () => {
		const service = new DownloaderServiceImpl();
		execMock.mockImplementation(
			(
				_cmd: string,
				optionsOrCb: unknown,
				maybeCb?: (err: unknown, stdout?: string, stderr?: string) => void,
			) => {
				const cb = (
					typeof optionsOrCb === "function" ? optionsOrCb : maybeCb
				) as (err: unknown, stdout?: string, stderr?: string) => void;
				cb(null, {
					stdout: `${JSON.stringify({ id: "v1", title: "Video", url: "https://v", duration: 42, thumbnails: [{ url: "thumb" }] })}\n`,
					stderr: "",
				} as unknown as string);
				return {};
			},
		);

		const result = await service.searchVideos("video query", 3);

		expect(result).toEqual([
			{
				id: "v1",
				title: "Video",
				url: "https://v",
				duration: 42,
				thumbnail: "thumb",
			},
		]);
	});

	it("returns empty list when yt-dlp output is empty or execution fails", async () => {
		const service = new DownloaderServiceImpl();

		execMock.mockImplementationOnce(
			(
				_cmd: string,
				optionsOrCb: unknown,
				maybeCb?: (err: unknown, stdout?: string, stderr?: string) => void,
			) => {
				const cb = (
					typeof optionsOrCb === "function" ? optionsOrCb : maybeCb
				) as (err: unknown, stdout?: string, stderr?: string) => void;
				cb(null, { stdout: "", stderr: "" } as unknown as string);
				return {};
			},
		);
		await expect(service.searchVideos("query", 0)).resolves.toEqual([]);

		execMock.mockImplementationOnce(
			(
				_cmd: string,
				optionsOrCb: unknown,
				maybeCb?: (err: unknown, stdout?: string, stderr?: string) => void,
			) => {
				const cb = (
					typeof optionsOrCb === "function" ? optionsOrCb : maybeCb
				) as (err: unknown, stdout?: string, stderr?: string) => void;
				cb(new Error("yt-dlp failed"));
				return {};
			},
		);
		await expect(service.searchVideos("query", 1)).resolves.toEqual([]);
	});

	it("handles synchronous spawn failures in downloadContent", async () => {
		const service = new DownloaderServiceImpl();
		spawnMock.mockImplementation(() => {
			throw new Error("spawn failed");
		});

		await expect(
			(service as never).downloadContent("cmd", "file"),
		).resolves.toBeUndefined();
	});

	it("covers downloadYoutubeDownloader early return and error branches in isolated module", async () => {
		const httpsGet = jest.fn();
		const existsSyncMock = jest.fn().mockReturnValue(true);

		jest.resetModules();
		jest.doMock("node:child_process", () => ({
			spawn: jest.fn(),
			exec: jest.fn(),
		}));
		jest.doMock("follow-redirects", () => ({
			https: { get: httpsGet },
		}));
		jest.doMock("node:fs", () => {
			const actual = jest.requireActual("node:fs");
			return {
				__esModule: true,
				...actual,
				default: {
					...actual,
					existsSync: existsSyncMock,
				},
				existsSync: existsSyncMock,
				mkdirSync: jest.fn(),
				chmodSync: jest.fn(),
				unlinkSync: jest.fn(),
				createWriteStream: jest.fn(() => {
					const emitter = new EventEmitter() as EventEmitter & {
						close: (cb: () => void) => void;
					};
					emitter.close = (cb: () => void) => cb();
					return emitter;
				}),
			};
		});
		jest.doMock("@/api/v1/shared/infrastructure/adapters/di/container", () => ({
			downloaderService: { getYtDlpPath: jest.fn(() => "yt-dlp") },
			fileSystemService: {
				getExternalPath: jest.fn((p: string) => `/ext/${p}`),
				createFolder: jest.fn(),
				join: jest.fn((...parts: string[]) => parts.join("/")),
			},
			notificationService: { broadcast: jest.fn() },
		}));

		const isolated = await import(
			"@/api/v1/shared/infrastructure/adapters/downloader/DownloaderServiceImpl"
		);
		const service = new isolated.DownloaderServiceImpl();

		await expect(service.downloadYoutubeDownloader()).resolves.toBeUndefined();
		expect(httpsGet).not.toHaveBeenCalled();

		existsSyncMock.mockReturnValue(false);
		httpsGet.mockImplementation(
			(
				_url: string,
				cb: (res: { statusCode: number; pipe: (f: unknown) => void }) => void,
			) => {
				cb({ statusCode: 500, pipe: () => undefined });
				return { on: jest.fn().mockReturnThis() };
			},
		);

		await expect(service.downloadYoutubeDownloader()).rejects.toThrow(
			"Error downloading yt-dlp",
		);
	});
});
