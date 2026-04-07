/**
 * Phase 3: Live IMDb score smoke tests.
 * Requires LIVE_INTEGRATION=true.
 *
 * Run with: pnpm test:live
 */

import { IMDBScoreServiceImpl } from '@/api/v1/shared/infrastructure/adapters/imdb-score/IMDBScoreServiceImpl';

const LIVE = process.env.LIVE_INTEGRATION === 'true';
const describeIfLive = LIVE ? describe : describe.skip;

describeIfLive('IMDBScoreServiceImpl – Live (Phase 3)', () => {
    let service: IMDBScoreServiceImpl;

    beforeEach(() => {
        service = new IMDBScoreServiceImpl();
    });

    it('returns a numeric score for a known movie (The Shawshank Redemption)', async () => {
        const result = await service.getIMDBScore('tt0111161');

        expect(typeof result).toBe('number');
        if (result === -1) {
            console.warn('IMDb temporarily unreachable — skipping score assertion');
            return;
        }
        expect(result).toBeGreaterThan(8.0);
        expect(result).toBeLessThanOrEqual(10.0);
    }, 20000);

    it('returns a numeric score for The Godfather', async () => {
        const result = await service.getIMDBScore('tt0068646');

        expect(typeof result).toBe('number');
        if (result === -1) {
            console.warn('IMDb temporarily unreachable — skipping score assertion');
            return;
        }
        expect(result).toBeGreaterThan(8.0);
    }, 20000);

    it('returns -1 for an invalid IMDb id', async () => {
        const result = await service.getIMDBScore('tt0000000');
        expect(result).toBe(-1);
    }, 20000);

    it('returns -1 for a non-existent id', async () => {
        const result = await service.getIMDBScore('tt9999999');
        expect(result).toBe(-1);
    }, 20000);
});
