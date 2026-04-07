import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

const mockPlayList = {
    id: 'playlist-1',
    title: 'Road Trip',
    description: 'Best songs',
    songs: [],
};

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {
        getPlayLists: jest.fn(),
        getPlayListById: jest.fn(),
        createPlayList: jest.fn(),
        updatePlayList: jest.fn(),
        deletePlayList: jest.fn(),
        addSongToPlayList: jest.fn(),
        removeSongFromPlayList: jest.fn(),
    },
    fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let usersRepo: UsersRepositoryImpl;
let adminToken: string;

beforeAll(async () => {
    process.env.JWT_SECRET = 'test-api-secret-playlists';
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

    const admin = await usersRepo.create({ username: 'admin', password: 'Admin123!', type: UserType.ADMIN });
    adminToken = jwt.sign({ userId: admin.id, type: admin.type }, process.env.JWT_SECRET!, { expiresIn: '1h' });

    mockContainer.useCases.getPlayLists.mockReturnValue({ execute: jest.fn().mockResolvedValue([mockPlayList]) });
    mockContainer.useCases.getPlayListById.mockReturnValue({ execute: jest.fn().mockResolvedValue(mockPlayList) });
    mockContainer.useCases.createPlayList.mockReturnValue({ execute: jest.fn().mockResolvedValue(mockPlayList) });
    mockContainer.useCases.updatePlayList.mockReturnValue({ execute: jest.fn().mockResolvedValue({ ...mockPlayList, title: 'Updated' }) });
    mockContainer.useCases.deletePlayList.mockReturnValue({ execute: jest.fn().mockResolvedValue(undefined) });
    mockContainer.useCases.addSongToPlayList.mockReturnValue({ execute: jest.fn().mockResolvedValue(undefined) });
    mockContainer.useCases.removeSongFromPlayList.mockReturnValue({ execute: jest.fn().mockResolvedValue(undefined) });
});

describe('Playlists API', () => {
    it('GET /api/playlists returns 200 for admin', async () => {
        const res = await request(app).get('/api/playlists').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('POST /api/playlists creates playlist', async () => {
        const res = await request(app)
            .post('/api/playlists')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Road Trip' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('PATCH /api/playlists/:id updates playlist', async () => {
        const res = await request(app)
            .patch('/api/playlists/playlist-1')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ title: 'Updated' });

        expect(res.status).toBe(200);
    });

    it('POST /api/playlists/:id/songs adds song to playlist', async () => {
        const res = await request(app)
            .post('/api/playlists/playlist-1/songs')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ songId: 'song-1' });

        expect(res.status).toBe(200);
    });
});
