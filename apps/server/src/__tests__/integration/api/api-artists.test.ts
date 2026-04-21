import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

const mockArtist = {
  id: 'artist-1',
  name: 'Test Artist',
  albums: [],
  songs: [],
};

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    getArtistById: jest.fn(),
    updateArtist: jest.fn(),
  },
  fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let usersRepo: UsersRepositoryImpl;
let adminToken: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-api-secret-artists';
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

  const admin = await usersRepo.create({
    username: 'admin',
    password: 'Admin123!',
    type: UserType.ADMIN,
  });
  adminToken = jwt.sign({ userId: admin.id, type: admin.type }, process.env.JWT_SECRET || '', {
    expiresIn: '1h',
  });

  mockContainer.useCases.getArtistById.mockReturnValue({
    execute: jest.fn().mockResolvedValue(mockArtist),
  });
  mockContainer.useCases.updateArtist.mockReturnValue({
    execute: jest.fn().mockResolvedValue({ ...mockArtist, name: 'Updated Artist' }),
  });
});

describe('Artists API', () => {
  it('GET /api/artists/:id returns 200 for admin', async () => {
    const res = await request(app)
      .get('/api/artists/artist-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('GET /api/artists/:id returns 404 when artist not found', async () => {
    mockContainer.useCases.getArtistById.mockReturnValue({
      execute: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .get('/api/artists/unknown')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it('PATCH /api/artists/:id returns 200 for admin', async () => {
    const res = await request(app)
      .patch('/api/artists/artist-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Artist' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
