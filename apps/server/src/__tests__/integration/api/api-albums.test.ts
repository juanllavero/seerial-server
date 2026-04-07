import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

const mockAlbum = {
    id: 'album-1',
    title: 'Test Album',
    year: '2020',
    songs: [],
    artists: [],
    libraryId: 'lib-1',
};

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {
        getAlbumById: jest.fn(),
        updateAlbum: jest.fn(),
        deleteAlbum: jest.fn(),
    },
    fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let usersRepo: UsersRepositoryImpl;
let userToken: string;
let adminToken: string;

beforeAll(async () => {
    process.env.JWT_SECRET = 'test-api-secret-albums';
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

    const admin = await usersRepo.create({ username: 'admin', password: 'Admin123!', type: UserType.ADMIN });
    adminToken = jwt.sign({ userId: admin.id, type: admin.type }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    mockContainer.useCases.getAlbumById.mockReturnValue({ execute: jest.fn().mockResolvedValue(mockAlbum) });
    mockContainer.useCases.updateAlbum.mockReturnValue({ execute: jest.fn().mockResolvedValue({ ...mockAlbum, title: 'Updated Album' }) });
    mockContainer.useCases.deleteAlbum.mockReturnValue({ execute: jest.fn().mockResolvedValue(undefined) });
});

describe('Albums API', () => {
    it('GET /api/albums/:id returns 200 for authenticated user', async () => {
        const res = await request(app)
            .get('/api/albums/album-1')
            .set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('PATCH /api/albums/:id returns 200 for admin', async () => {
        const res = await request(app)
            .patch('/api/albums/album-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Updated Album' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('DELETE /api/albums/:id returns 200 for admin', async () => {
        const res = await request(app)
            .delete('/api/albums/album-1')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
