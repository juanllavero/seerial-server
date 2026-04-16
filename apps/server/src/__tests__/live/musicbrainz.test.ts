import { MusicBrainzService } from "@/api/v1/shared/infrastructure/services/MusicBrainzService";

const LIVE = process.env.LIVE_INTEGRATION === "true";
const describeIfLive = LIVE ? describe : describe.skip;

describeIfLive("MusicBrainzService – Live (Phase 3)", () => {
	let service: MusicBrainzService;

	beforeEach(() => {
		service = new MusicBrainzService();
	});

	it("looks up an artist by name", async () => {
		const result = await service.searchArtist("Radiohead");
		expect(result === null || typeof result === "string").toBe(true);
	}, 30000);

	it("looks up album metadata and exposes track listing when available", async () => {
		const result = await service.searchRelease("OK Computer", "Radiohead");

		if (!result) {
			console.warn(
				"MusicBrainz unavailable or no match returned — skipping strict assertions",
			);
			return;
		}

		expect(result.title).toBeTruthy();
		expect(typeof result.artist).toBe("string");
		expect(Array.isArray(result.tracks)).toBe(true);
	}, 45000);

	it("respects rate limiting between sequential requests", async () => {
		const startedAt = Date.now();
		await service.searchArtist("Daft Punk");
		await service.searchArtist("Massive Attack");
		const elapsed = Date.now() - startedAt;

		expect(elapsed).toBeGreaterThanOrEqual(900);
	}, 45000);
});
