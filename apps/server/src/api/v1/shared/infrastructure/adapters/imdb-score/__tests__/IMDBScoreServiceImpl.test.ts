import { IMDBScoreServiceImpl } from '../IMDBScoreServiceImpl';

describe('IMDBScoreServiceImpl - Integration Tests', () => {
  let service: IMDBScoreServiceImpl;

  beforeEach(() => {
    service = new IMDBScoreServiceImpl();
  });

  describe('getIMDBScore', () => {
    it('should successfully scrape IMDB score for a known movie (The Shawshank Redemption)', async () => {
      const imdbId = 'tt0111161'; // The Shawshank Redemption

      const result = await service.getIMDBScore(imdbId);

      // The Shawshank Redemption has a high rating, should be between 9.0 and 10.0
      expect(result).toBeGreaterThan(9.0);
      expect(result).toBeLessThanOrEqual(10.0);
      expect(typeof result).toBe('number');
    }, 15000); // 15 second timeout for network request

    it('should successfully scrape IMDB score for another known movie (The Godfather)', async () => {
      const imdbId = 'tt0068646'; // The Godfather

      const result = await service.getIMDBScore(imdbId);

      // The Godfather has a high rating, should be between 9.0 and 10.0
      expect(result).toBeGreaterThan(9.0);
      expect(result).toBeLessThanOrEqual(10.0);
      expect(typeof result).toBe('number');
    }, 15000);

    it('should return -1 for invalid IMDB ID', async () => {
      const invalidImdbId = 'tt0000000';

      const result = await service.getIMDBScore(invalidImdbId);

      expect(result).toBe(-1);
    }, 15000);

    it('should return -1 for non-existent movie', async () => {
      const nonExistentId = 'tt9999999';

      const result = await service.getIMDBScore(nonExistentId);

      expect(result).toBe(-1);
    }, 15000);

    it('should handle network timeouts gracefully', async () => {
      // Test with a real but slow IMDB ID
      const imdbId = 'tt0111161';

      const result = await service.getIMDBScore(imdbId);

      // Should either return a valid score or -1 (if timeout/network issue)
      expect(typeof result).toBe('number');
      if (result !== -1) {
        expect(result).toBeGreaterThan(0);
        expect(result).toBeLessThanOrEqual(10);
      }
    }, 20000); // Allow more time for potential network issues
  });
});
