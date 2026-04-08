import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

const mockCollection = {
  id: 'collection-1',
  title: 'Favorites',
  description: 'My picks',
  libraryId: 'lib-1',
};

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    getMusicExtras: jest.fn(),
    reorderCollectionItems: jest.fn(),
    getCollectionById: jest.fn(),
    updateCollection: jest.fn(),
    deleteCollection: jest.fn(),
  },
  fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let usersRepo: UsersRepositoryImpl;
let userToken: string;
let adminToken: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-api-secret-collections';
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

  mockContainer.useCases.getMusicExtras.mockReturnValue({
    execute: jest.fn().mockResolvedValue([]),
  });
  mockContainer.useCases.reorderCollectionItems.mockReturnValue({
    execute: jest.fn().mockResolvedValue(undefined),
  });
  mockContainer.useCases.getCollectionById.mockReturnValue({
    execute: jest.fn().mockResolvedValue(mockCollection),
  });
  mockContainer.useCases.updateCollection.mockReturnValue({
    execute: jest.fn().mockResolvedValue({ ...mockCollection, title: 'Updated' }),
  });
  mockContainer.useCases.deleteCollection.mockReturnValue({
    execute: jest.fn().mockResolvedValue(undefined),
  });
});

describe('Collections API', () => {
  it('GET /api/collections/:id returns 200 for authenticated user', async () => {
    const res = await request(app)
      .get('/api/collections/collection-1')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('PATCH /api/collections/:id returns 200 for admin', async () => {
    const res = await request(app)
      .patch('/api/collections/collection-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/collections/:id/items/order returns 200 for admin', async () => {
    const res = await request(app)
      .post('/api/collections/collection-1/items/order')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ orderedItems: [{ id: 'movie-1', type: 'movie' }] });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/collections/:id returns 200 for admin', async () => {
    const res = await request(app)
      .delete('/api/collections/collection-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
