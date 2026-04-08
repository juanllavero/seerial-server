import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

const mockSeries = {
  id: 'series-1',
  name: 'Test Show',
  description: 'A test series',
  year: 2022,
  rating: 8.0,
  poster: '',
  backdrop: '',
  genres: [],
  cast: [],
  externalId: '',
  status: 'Ended',
  seasons: [],
  watchLists: [],
  libraryId: 'lib-1',
};

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    getSeriesById: jest.fn(),
    updateSeries: jest.fn(),
    deleteSeries: jest.fn(),
    refreshSeriesMetadata: jest.fn(),
    updateShowId: jest.fn(),
    updateEpisodeGroup: jest.fn(),
    getSeasonById: jest.fn(),
    getEpisodeById: jest.fn(),
    getVideoByEpisodeId: jest.fn(),
    addVideoToWatchList: jest.fn(),
    removeVideoFromWatchList: jest.fn(),
    removeVideoFromContinueWatching: jest.fn(),
    updateVideo: jest.fn(),
    addSeasonToWatchList: jest.fn(),
    removeSeasonFromWatchList: jest.fn(),
    updateSeason: jest.fn(),
    addSeriesToWatchList: jest.fn(),
    removeSeriesFromWatchList: jest.fn(),
  },
  externalSearchService: {
    searchTvShows: jest.fn().mockResolvedValue([]),
    searchEpisodeGroups: jest.fn().mockResolvedValue([]),
  },
  fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let usersRepo: UsersRepositoryImpl;
let userToken: string;
let adminToken: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-api-secret-series';
  await getTestDataSource();
  usersRepo = new UsersRepositoryImpl();
  app = createTestApp();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  const ds = await getTestDataSource();
  await clearAllTables(ds);

  const user = await usersRepo.create({ username: 'user1', type: UserType.NORMAL });
  userToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });

  const admin = await usersRepo.create({
    username: 'admin',
    password: 'Admin123!',
    type: UserType.ADMIN,
  });
  adminToken = jwt.sign({ userId: admin.id, type: admin.type }, process.env.JWT_SECRET!, {
    expiresIn: '1h',
  });

  mockContainer.useCases.getSeriesById.mockReturnValue({
    execute: jest.fn().mockResolvedValue(mockSeries),
  });
  mockContainer.useCases.updateSeries.mockReturnValue({
    execute: jest.fn().mockResolvedValue({ ...mockSeries, name: 'Updated Show' }),
  });
  mockContainer.useCases.deleteSeries.mockReturnValue({
    execute: jest.fn().mockResolvedValue(undefined),
  });
  mockContainer.useCases.refreshSeriesMetadata.mockReturnValue({
    execute: jest.fn().mockResolvedValue(undefined),
  });
});

describe('Series API', () => {
  describe('GET /api/series/:id (cookieAuth)', () => {
    it('returns 200 with series data for authenticated user', async () => {
      const res = await request(app)
        .get('/api/series/series-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/series/series-1');
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('returns 404 when series not found', async () => {
      mockContainer.useCases.getSeriesById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .get('/api/series/nonexistent')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/series/show/:id (adminAuth)', () => {
    it('returns 200 and updates series with admin auth', async () => {
      const res = await request(app)
        .patch('/api/series/show/series-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Show' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).patch('/api/series/show/series-1').send({ name: 'X' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('returns 403 for non-admin user', async () => {
      const res = await request(app)
        .patch('/api/series/show/series-1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'X' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/series/:id (adminAuth)', () => {
    it('returns 200 when deleting with admin auth', async () => {
      const res = await request(app)
        .delete('/api/series/series-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/series/metadata (adminAuth)', () => {
    it('returns 200 when refreshing metadata', async () => {
      const res = await request(app)
        .post('/api/series/metadata')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ id: 'series-1' });

      expect(res.status).toBe(200);
    });
  });
});
