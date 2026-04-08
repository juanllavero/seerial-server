import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    updateWatchStateUseCase: jest.fn(),
  },
  fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let usersRepo: UsersRepositoryImpl;
let userToken: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-api-secret-watch-lists';
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
  userToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || '', { expiresIn: '1h' });

  mockContainer.useCases.updateWatchStateUseCase.mockReturnValue({
    execute: jest.fn().mockResolvedValue(undefined),
  });
});

describe('Watch Lists API', () => {
  describe('PATCH /api/watch-lists/watch-state (cookieAuth)', () => {
    it('returns 200 when updating watch state with auth', async () => {
      const res = await request(app)
        .patch('/api/watch-lists/watch-state')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          videoId: 'video-1',
          timeWatched: 120,
          watched: false,
          userId: 'fallback-user',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app)
        .patch('/api/watch-lists/watch-state')
        .send({ videoId: 'video-1', timeWatched: 120, watched: false, userId: 'user-1' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
