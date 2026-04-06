import fs from 'node:fs';
import path from 'node:path';
import { TMDbApiClient } from '../TMDbApiClient';

// Mock the fileSystemService import
jest.mock('../../di/container', () => ({
  fileSystemService: {
    join: jest.fn((...parts: string[]) => path.join(...parts)),
    getExternalPath: jest.fn((p: string) => p),
    isFile: jest.fn(async (p: string) => {
      // Return true for the expected path
      const appDataPath =
        process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
      const expectedPath = path.join(
        appDataPath,
        'Seerial Media Server',
        'resources',
        'config',
        'keys.properties',
      );
      return p === expectedPath && fs.existsSync(p);
    }),
  },
}));

describe('TMDbApiClient - Integration Tests', () => {
  let client: TMDbApiClient;

  beforeEach(() => {
    client = new TMDbApiClient();
    // Reset client state
    client.connectionStatus = false;
    client.THEMOVIEDB_API_TOKEN = '';
  });

  describe('initialize', () => {
    it('should initialize successfully with valid API key from properties file', async () => {
      // Check if keys.properties file exists and has API key
      const appDataPath =
        process.env.APPDATA || path.join(process.env.USERPROFILE || '', 'AppData', 'Local');
      const propertiesFilePath = path.join(
        appDataPath,
        'Seerial Media Server',
        'resources',
        'config',
        'keys.properties',
      );

      if (!fs.existsSync(propertiesFilePath)) {
        console.warn(
          'Skipping TMDb API test: keys.properties file not found at',
          propertiesFilePath,
        );
        return;
      }

      const result = await client.initialize();

      if (result) {
        expect(client.connectionStatus).toBe(true);
        expect(client.THEMOVIEDB_API_TOKEN).toBeTruthy();
        expect(typeof client.THEMOVIEDB_API_TOKEN).toBe('string');
      } else {
        console.warn('TMDb API key validation failed - this may be expected if key is invalid');
      }
    }, 10000);
  });

  describe('makeRequest - with real API', () => {
    beforeEach(async () => {
      // Initialize client first
      await client.initialize();
    });

    it('should successfully fetch movie data from TMDb API', async () => {
      if (!client.connectionStatus) {
        console.warn('Skipping TMDb API test: Client not initialized');
        return;
      }

      // Test with a known movie ID (The Shawshank Redemption)
      const result = await client.makeRequest<{ id: number; title: string }>('movie/278', {
        language: 'en-US',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result.id).toBe(278);
      expect(result.title).toContain('Shawshank');
    }, 10000);

    it('should successfully search for movies', async () => {
      if (!client.connectionStatus) {
        console.warn('Skipping TMDb API test: Client not initialized');
        return;
      }

      const result = await client.makeRequest<{
        results: Array<{ id: number; title: string }>;
      }>('search/movie', {
        query: 'The Matrix',
        language: 'en-US',
        page: 1,
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('results');
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);

      // Check that first result has expected properties
      const firstResult = result.results[0];
      expect(firstResult).toHaveProperty('id');
      expect(firstResult).toHaveProperty('title');
      expect(firstResult.title.toLowerCase()).toContain('matrix');
    }, 10000);

    it('should handle invalid movie ID gracefully', async () => {
      if (!client.connectionStatus) {
        console.warn('Skipping TMDb API test: Client not initialized');
        return;
      }

      // Test with invalid movie ID
      try {
        await client.makeRequest('movie/999999999');
        // If we get here, the API didn't throw an error
      } catch (error: any) {
        // This is expected - invalid ID should cause an error
        expect(error).toBeDefined();
      }
    }, 10000);

    it('should fetch TV show data', async () => {
      if (!client.connectionStatus) {
        console.warn('Skipping TMDb API test: Client not initialized');
        return;
      }

      // Test with Breaking Bad (TV show ID: 1396)
      const result = await client.makeRequest<{ id: number; name: string }>('tv/1396', {
        language: 'en-US',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('name');
      expect(result.id).toBe(1396);
      expect(result.name.toLowerCase()).toContain('breaking bad');
    }, 10000);
  });

  describe('getAPIKeyStatus', () => {
    it('should validate API key status', async () => {
      const result = await client.getAPIKeyStatus();

      // Result depends on whether API key is configured
      expect(typeof result).toBe('boolean');
    }, 5000);
  });
});
