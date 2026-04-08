import 'reflect-metadata';
import type { Express } from 'express';
import request from 'supertest';
import { AuthenticateUserUseCase } from '@/api/v1/users/application/usecases/AuthenticateUserUseCase';
import { CreateUserUseCase } from '@/api/v1/users/application/usecases/CreateUserUseCase';
import { DeleteUserUseCase } from '@/api/v1/users/application/usecases/DeleteUserUseCase';
import { GetAllUsersUseCase } from '@/api/v1/users/application/usecases/GetAllUsersUseCase';
import { UpdateUserUseCase } from '@/api/v1/users/application/usecases/UpdateUserUseCase';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

// Prevents p-limit ESM loading through SeriesModel -> container chain
jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    createUser: jest.fn(),
    authenticateUser: jest.fn(),
    getAllUsers: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
  },
  fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let repo: UsersRepositoryImpl;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-api-secret-for-http';
  await getTestDataSource();
  repo = new UsersRepositoryImpl();

  mockContainer.useCases.createUser.mockReturnValue(new CreateUserUseCase(repo));
  mockContainer.useCases.authenticateUser.mockReturnValue(new AuthenticateUserUseCase(repo));
  mockContainer.useCases.getAllUsers.mockReturnValue(new GetAllUsersUseCase(repo));
  mockContainer.useCases.updateUser.mockReturnValue(new UpdateUserUseCase(repo));
  mockContainer.useCases.deleteUser.mockReturnValue(new DeleteUserUseCase(repo));

  app = createTestApp();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  const ds = await getTestDataSource();
  await clearAllTables(ds);

  // Re-wire use cases after each table clear so new instances reference fresh repo state
  mockContainer.useCases.createUser.mockReturnValue(new CreateUserUseCase(repo));
  mockContainer.useCases.authenticateUser.mockReturnValue(new AuthenticateUserUseCase(repo));
  mockContainer.useCases.getAllUsers.mockReturnValue(new GetAllUsersUseCase(repo));
  mockContainer.useCases.updateUser.mockReturnValue(new UpdateUserUseCase(repo));
  mockContainer.useCases.deleteUser.mockReturnValue(new DeleteUserUseCase(repo));
});

describe('Users API', () => {
  describe('GET /api/users/public', () => {
    it('returns 200 with empty array when no users exist', async () => {
      const res = await request(app).get('/api/users/public');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('returns visible users only (excludes hideInLogin=true)', async () => {
      await repo.create({ username: 'visible', type: UserType.NORMAL });
      await repo.create({ username: 'hidden', type: UserType.NORMAL, hideInLogin: true });

      const res = await request(app).get('/api/users/public');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].username).toBe('visible');
    });

    it('returns user DTO fields without sensitive data', async () => {
      await repo.create({ username: 'alice', type: UserType.NORMAL });

      const res = await request(app).get('/api/users/public');
      expect(res.status).toBe(200);
      const user = res.body.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username', 'alice');
      expect(user).toHaveProperty('type');
      expect(user).not.toHaveProperty('password');
    });
  });

  describe('POST /api/users/login', () => {
    it('returns 200 and sets cookie on valid credentials', async () => {
      await repo.create({ username: 'loginuser', password: 'pass123', type: UserType.NORMAL });

      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'loginuser', password: 'pass123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.username).toBe('loginuser');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('returns error on wrong password', async () => {
      await repo.create({ username: 'loginuser2', password: 'correct', type: UserType.NORMAL });

      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'loginuser2', password: 'wrong' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('returns error on non-existent user', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'ghost', password: 'anything' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/users (managementAuth)', () => {
    it('returns 200 and creates user from localhost request', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ username: 'newuser', type: UserType.NORMAL });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.username).toBe('newuser');
    });

    it('creates admin user with password', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ username: 'adminuser', password: 'adminpass', type: UserType.ADMIN });

      expect(res.status).toBe(200);
      expect(res.body.data.user.type).toBe(UserType.ADMIN);
    });

    it('returns error when creating admin without password', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ username: 'adminnopass', type: UserType.ADMIN });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/users/:id (managementAuth)', () => {
    it('returns 200 and updates user fields', async () => {
      const created = await repo.create({ username: 'toUpdate', type: UserType.NORMAL });

      const res = await request(app)
        .patch(`/api/users/${created.id}`)
        .send({ username: 'updatedName' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('updatedName');
    });

    it('returns error for invalid user id', async () => {
      const res = await request(app).patch('/api/users/not-a-valid-uuid').send({ username: 'x' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('returns error when updating non-existent user', async () => {
      const res = await request(app)
        .patch('/api/users/00000000-0000-0000-0000-000000000000')
        .send({ username: 'ghost' });

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('DELETE /api/users/:id (managementAuth)', () => {
    it('returns 200 and deletes the user', async () => {
      const created = await repo.create({ username: 'toDelete', type: UserType.NORMAL });

      const res = await request(app).delete(`/api/users/${created.id}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull();

      // Verify actually deleted
      const allUsers = await repo.findAll();
      expect(allUsers.find((u) => u.id === created.id)).toBeUndefined();
    });

    it('returns error for invalid uuid', async () => {
      const res = await request(app).delete('/api/users/bad-id');

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/users/logout', () => {
    it('returns 200 and clears the cookie', async () => {
      const res = await request(app).post('/api/users/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      expect(setCookie[0]).toContain('token=');
      expect(setCookie[0]).toContain('Max-Age=0');
    });
  });
});
