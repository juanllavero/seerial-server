import {
	convertTime,
	formatAudioChannels,
	formatResolution,
	formatTime,
	processAudioData,
	processSubtitleData,
	processVideoData,
} from "@/api/v1/shared/infrastructure/adapters/ffmpeg/utils/ffmpegUtils";

describe("ffmpegUtils", () => {
	it("formats rich video streams including HDR and bitrate information", () => {
		const result = processVideoData({
			index: 1,
			codec_name: "hevc",
			codec_long_name: "H.265 / HEVC",
			tags: { BPS: "8000000" },
			avg_frame_rate: "24000/1001",
			width: "3840",
			height: "2160",
			chroma_location: "left",
			color_space: "bt2020nc",
			display_aspect_ratio: "16:9",
			profile: "Main 10",
			refs: "4",
			color_range: "tv",
		});

		expect(result).toMatchObject({
			id: 1,
			codec: "HEVC",
			codecExt: "H.265 / HEVC",
			bitrate: "8000",
			framerate: "23.976 fps",
			codedWidth: "3840",
			codedHeight: "2160",
			chromaLocation: "left",
			colorSpace: "bt2020nc",
			aspectRatio: "16:9",
			profile: "Main 10",
			refFrames: "4",
			colorRange: "tv",
			displayTitle: "4K HDR10 (HEVC Main 10)",
		});
	});

	it("falls back to a numeric frame rate when ffprobe reports a zero denominator", () => {
		const result = processVideoData({
			codec_name: "av1",
			avg_frame_rate: "24/0",
			width: "1024",
			height: "576",
		});

		expect(result.framerate).toBe("24.000 fps");
		expect(result.displayTitle).toBe("576p  (AV1 )");
	});

	it("formats audio tracks including language, bitrate and LC profile", () => {
		const result = processAudioData({
			index: 2,
			codec_name: "aac",
			codec_long_name: "AAC",
			channels: 6,
			channel_layout: "5.1(side)",
			tags: { BPS: "320000", language: "en" },
			bits_per_raw_sample: "24",
			profile: "LC",
			sample_rate: "48000",
		});

		expect(result).toMatchObject({
			id: 2,
			codec: "AAC",
			codecExt: "AAC",
			channels: "5.1",
			channelLayout: "5.1(side)",
			bitrate: "320",
			languageTag: "en",
			language: "English",
			bitDepth: "24",
			profile: "lc",
			samplingRate: "48000 hz",
			displayTitle: "(AAC 5.1)",
		});
	});

	it("preserves DTS-HD MA as the display codec name", () => {
		const result = processAudioData({
			codec_name: "dts",
			channels: 8,
			profile: "DTS-HD MA",
			bits_per_raw_sample: "N/A",
		});

		expect(result.profile).toBe("ma");
		expect(result.channels).toBe("7.1");
		expect(result.bitDepth).toBe("");
		expect(result.displayTitle).toBe("(DTS-HD MA 7.1)");
	});

	it("formats forced subtitle tracks and normalizes common codec names", () => {
		const result = processSubtitleData({
			index: 3,
			codec_name: "hdmv_pgs_subtitle",
			codec_long_name: "PGS",
			tags: { language: "es", title: "Latin American Spanish" },
			language: "Spanish",
			disposition: { forced: 1 },
		});

		expect(result).toMatchObject({
			id: 3,
			codec: "HDMV_PGS_SUBTITLE",
			codecExt: "PGS",
			languageTag: "es",
			language: "Spanish",
			title: "Latin American Spanish",
			displayTitle: "(Forced)(PGS)",
		});
	});

	it("formats generic helper values", () => {
		expect(formatResolution("1920", "1080")).toBe("1080p");
		expect(formatResolution("1111", "444")).toBe("444p");
		expect(formatAudioChannels(1)).toBe("MONO");
		expect(formatAudioChannels(9)).toBe("9 channels");
		expect(convertTime(3_723_000)).toBe("01:02:03");
		expect(formatTime(3661)).toBe("01:01:01");
		expect(formatTime(125)).toBe("02:05");
	});
});
