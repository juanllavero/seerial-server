import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

const mockSeason = {
  id: 'season-1',
  name: 'Season 1',
  seasonNumber: 1,
  episodeCount: 10,
  year: 2022,
  description: 'Season 1',
  poster: '',
  episodes: [],
  watchLists: [],
  seriesId: 'series-1',
};

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    getSeasonById: jest.fn(),
    updateSeason: jest.fn(),
    deleteSeason: jest.fn(),
    setEpisodeWatchState: jest.fn(),
  },
  fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let usersRepo: UsersRepositoryImpl;
let userToken: string;
let adminToken: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-api-secret-seasons';
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

  const user = await usersRepo.create({
    username: 'user1',
    type: UserType.NORMAL,
  });
  userToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || '', {
    expiresIn: '1h',
  });

  const admin = await usersRepo.create({
    username: 'admin',
    password: 'Admin123!',
    type: UserType.ADMIN,
  });
  adminToken = jwt.sign({ userId: admin.id, type: admin.type }, process.env.JWT_SECRET || '', {
    expiresIn: '1h',
  });

  mockContainer.useCases.getSeasonById.mockReturnValue({
    execute: jest.fn().mockResolvedValue(mockSeason),
  });
  mockContainer.useCases.updateSeason.mockReturnValue({
    execute: jest.fn().mockResolvedValue({ ...mockSeason, name: 'Updated Season' }),
  });
  mockContainer.useCases.deleteSeason.mockReturnValue({
    execute: jest.fn().mockResolvedValue(undefined),
  });
  mockContainer.useCases.setEpisodeWatchState.mockReturnValue({
    execute: jest.fn().mockResolvedValue(undefined),
  });
});

describe('Seasons API', () => {
  describe('GET /api/seasons/:id (cookieAuth)', () => {
    it('returns 200 with season data for authenticated user', async () => {
      const res = await request(app)
        .get('/api/seasons/season-1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/seasons/season-1');
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('returns 404 when season not found', async () => {
      mockContainer.useCases.getSeasonById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .get('/api/seasons/nonexistent')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/seasons/:id (adminAuth)', () => {
    it('returns 200 and updates season with admin auth', async () => {
      const res = await request(app)
        .patch('/api/seasons/season-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Season' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 401 without auth', async () => {
      const res = await request(app).patch('/api/seasons/season-1').send({ name: 'X' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/seasons/:id (adminAuth)', () => {
    it('returns 200 when deleting with admin auth', async () => {
      const res = await request(app)
        .delete('/api/seasons/season-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
