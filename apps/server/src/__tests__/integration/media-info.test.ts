/** biome-ignore-all lint/style/noNonNullAssertion: <Test file> */

import fs from "node:fs";
import { MediaInfoServiceImpl } from "@/api/v1/shared/infrastructure/adapters/media-info/MediaInfoServiceImpl";
import { ensureVideoFixture, TEST_VIDEO_PATH } from "../helpers/video-fixture";

describe("MediaInfoServiceImpl integration", () => {
	let service: MediaInfoServiceImpl;
	let videoPath: string;

	beforeAll(async () => {
		service = new MediaInfoServiceImpl();

		try {
			videoPath = await ensureVideoFixture();
		} catch {
			videoPath = TEST_VIDEO_PATH;
		}
	});

	it("returns general media information for the video fixture", async () => {
		if (!fs.existsSync(videoPath)) {
			return;
		}

		const result = await service.getMediaInformation(videoPath);

		expect(result).toBeDefined();
		expect(result?.mediaInfo?.file).toBeTruthy();
		expect(Array.isArray(result?.videoTracks)).toBe(true);
		expect(Array.isArray(result?.audioTracks)).toBe(true);
		expect(typeof result?.duration).toBe("number");
	}, 30000);

	it("returns audio metadata for the video fixture", async () => {
		if (!fs.existsSync(videoPath)) {
			return;
		}

		const result = (await service.getAudioMetadata(videoPath)) as
			| { codec?: string; artists?: string[] }
			| undefined;

		expect(result).toBeDefined();
		expect(typeof result?.codec).toBe("string");
		expect(Array.isArray(result?.artists)).toBe(true);
	}, 30000);

	it("returns chapter data array for the video fixture", async () => {
		if (!fs.existsSync(videoPath)) {
			return;
		}

		const result = await service.getMediaChapters(videoPath);
		expect(Array.isArray(result)).toBe(true);
	}, 30000);
});
