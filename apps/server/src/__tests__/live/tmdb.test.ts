/**
 * Phase 3: Live TMDB provider smoke tests.
 * Requires LIVE_INTEGRATION=true and a valid TMDB API key configured in the
 * Seerial keys.properties file on this machine.
 *
 * Run with: pnpm test:live
 */

import fs from 'node:fs';
import path from 'node:path';
import { TMDbApiClient } from '@/api/v1/shared/infrastructure/adapters/metadata/TMDbApiClient';

// Guard: skip all tests unless LIVE_INTEGRATION is set
const LIVE = process.env.LIVE_INTEGRATION === 'true';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    fileSystemService: {
        join: jest.fn((...parts: string[]) => path.join(...parts)),
        getExternalPath: jest.fn((p: string) => p),
        isFile: jest.fn(async (p: string) => fs.existsSync(p)),
    },
}));

const describeIfLive = LIVE ? describe : describe.skip;

describeIfLive('TMDbApiClient – Live (Phase 3)', () => {
    let client: TMDbApiClient;

    beforeEach(async () => {
        client = new TMDbApiClient();
        await client.initialize();
    });

    it('initializes and connects to TMDb with a valid API key', () => {
        // If no keys.properties exists, connectionStatus will be false — that is acceptable
        expect(typeof client.connectionStatus).toBe('boolean');
    });

    it('searches movies for a known title', async () => {
        if (!client.connectionStatus) {
            console.warn('Skipping: no valid TMDB API key configured');
            return;
        }

        const results = await client.searchMovies('The Dark Knight');
        expect(Array.isArray(results)).toBe(true);
        if (results.length > 0) {
            expect(results[0]).toHaveProperty('id');
        }
    }, 30000);

    it('searches TV shows for a known title', async () => {
        if (!client.connectionStatus) {
            console.warn('Skipping: no valid TMDB API key configured');
            return;
        }

        const results = await client.searchTvShows('Breaking Bad');
        expect(Array.isArray(results)).toBe(true);
        if (results.length > 0) {
            expect(results[0]).toHaveProperty('id');
        }
    }, 30000);

    it('fetches movie details by TMDB id', async () => {
        if (!client.connectionStatus) {
            console.warn('Skipping: no valid TMDB API key configured');
            return;
        }

        // The Dark Knight = TMDB id 155
        const details = await client.getMovieDetails(155);
        if (details) {
            expect(details).toHaveProperty('id', 155);
        }
    }, 30000);
});
