import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { GetLibrariesUseCase } from '@/api/v1/libraries/application/usecases/GetLibrariesUseCase';
import { GetLibraryContentUseCase } from '@/api/v1/libraries/application/usecases/GetLibraryContentUseCase';
import { GetLibraryUseCase } from '@/api/v1/libraries/application/usecases/GetLibraryUseCase';
import { ReorderLibrariesUseCase } from '@/api/v1/libraries/application/usecases/ReorderLibrariesUseCase';
import { ReorderLibraryItemsUseCase } from '@/api/v1/libraries/application/usecases/ReorderLibraryItemsUseCase';
import { UpdateLibraryUseCase } from '@/api/v1/libraries/application/usecases/UpdateLibraryUseCase';
import { LibrariesRepositoryImpl } from '@/api/v1/libraries/infrastructure/persistence/repositories/LibrariesRepositoryImpl';
import { DatabaseManager } from '@/api/v1/shared/infrastructure/persistence/DatabaseManager';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { LibraryTypes } from '@/data/interfaces/Media';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

// Prevent p-limit ESM loading through SeriesModel -> container chain
jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    getLibraries: jest.fn(),
    getLibrary: jest.fn(),
    getLibraryContent: jest.fn(),
    updateLibrary: jest.fn(),
    deleteLibrary: jest.fn(),
    reorderLibraries: jest.fn(),
    reorderLibraryItems: jest.fn(),
    // scanLibrary is complex (file-system); keep as a stub
    scanLibrary: jest.fn(),
  },
  fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let libRepo: LibrariesRepositoryImpl;
let usersRepo: UsersRepositoryImpl;
let adminToken: string;

function buildLibraryData(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Test Library',
    type: LibraryTypes.MOVIES,
    language: 'en',
    folders: [],
    order: 0,
    hidden: false,
    ...overrides,
  };
}

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-api-secret-libraries';
  const ds = await getTestDataSource();
  DatabaseManager.dataSource = ds;
  libRepo = new LibrariesRepositoryImpl();
  usersRepo = new UsersRepositoryImpl();
  app = createTestApp();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  const ds = await getTestDataSource();
  await clearAllTables(ds);

  // Create admin user and wire adminAuth token
  const admin = await usersRepo.create({
    username: 'admin',
    password: 'Admin123!',
    type: UserType.ADMIN,
  });
  adminToken = jwt.sign({ userId: admin.id, type: admin.type }, process.env.JWT_SECRET!, {
    expiresIn: '1h',
  });

  // Wire real use cases to the test library repo
  mockContainer.useCases.getLibraries.mockReturnValue(new GetLibrariesUseCase(libRepo));
  mockContainer.useCases.getLibrary.mockReturnValue(new GetLibraryUseCase(libRepo));
  mockContainer.useCases.getLibraryContent.mockReturnValue(new GetLibraryContentUseCase(libRepo));
  mockContainer.useCases.updateLibrary.mockReturnValue(new UpdateLibraryUseCase(libRepo));
  mockContainer.useCases.reorderLibraries.mockReturnValue(new ReorderLibrariesUseCase(libRepo));
  mockContainer.useCases.reorderLibraryItems.mockReturnValue(
    new ReorderLibraryItemsUseCase(libRepo),
  );
  // deleteLibrary and scanLibrary are mocked (complex dependencies)
  mockContainer.useCases.deleteLibrary.mockReturnValue({
    execute: jest.fn().mockResolvedValue(undefined),
  });
  mockContainer.useCases.scanLibrary.mockReturnValue({
    execute: jest.fn().mockResolvedValue(null),
  });
});

describe('Libraries API', () => {
  describe('GET /api/libraries', () => {
    it('returns 200 with empty array when no libraries exist', async () => {
      const res = await request(app)
        .get('/api/libraries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('returns 401 without auth token', async () => {
      const res = await request(app).get('/api/libraries');
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with all libraries', async () => {
      await libRepo.create(buildLibraryData({ name: 'Movies', type: LibraryTypes.MOVIES }));
      await libRepo.create(buildLibraryData({ name: 'Shows', type: LibraryTypes.SHOWS }));

      const res = await request(app)
        .get('/api/libraries')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/libraries/:id', () => {
    it('returns 200 with library data for existing id', async () => {
      const lib = await libRepo.create(
        buildLibraryData({ name: 'My Movies', type: LibraryTypes.MOVIES }),
      );

      const res = await request(app)
        .get(`/api/libraries/${lib.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(lib.id);
      expect(res.body.data.name).toBe('My Movies');
    });

    it('returns 404 for non-existent library', async () => {
      const res = await request(app)
        .get('/api/libraries/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/libraries/:id/content', () => {
    it('returns 200 with empty content for a library with no items', async () => {
      const lib = await libRepo.create(
        buildLibraryData({ name: 'Empty', type: LibraryTypes.MOVIES }),
      );

      const res = await request(app)
        .get(`/api/libraries/${lib.id}/content`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('returns 200 with empty array for non-existent library content', async () => {
      const res = await request(app)
        .get('/api/libraries/00000000-0000-0000-0000-000000000000/content')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('PATCH /api/libraries/:id', () => {
    it('returns 200 and updates library name', async () => {
      const lib = await libRepo.create(
        buildLibraryData({ name: 'Old Name', type: LibraryTypes.MOVIES }),
      );

      const res = await request(app)
        .patch(`/api/libraries/${lib.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Name');
    });

    it('returns 401 without auth', async () => {
      const lib = await libRepo.create(
        buildLibraryData({ name: 'A Library', type: LibraryTypes.MOVIES }),
      );

      const res = await request(app).patch(`/api/libraries/${lib.id}`).send({ name: 'X' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('DELETE /api/libraries/:id', () => {
    it('returns 200 when deleting a library (mocked use case)', async () => {
      const lib = await libRepo.create(
        buildLibraryData({ name: 'To Delete', type: LibraryTypes.MOVIES }),
      );

      const res = await request(app)
        .delete(`/api/libraries/${lib.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/libraries/order', () => {
    it('returns 200 when reordering libraries', async () => {
      const lib1 = await libRepo.create(
        buildLibraryData({ name: 'First', type: LibraryTypes.MOVIES }),
      );
      const lib2 = await libRepo.create(
        buildLibraryData({ name: 'Second', type: LibraryTypes.SHOWS }),
      );

      const res = await request(app)
        .post('/api/libraries/order')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderedLibraryIds: [lib2.id, lib1.id] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
