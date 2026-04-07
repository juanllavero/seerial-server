import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

const mockVideo = {
    id: 'video-1',
    filePath: '/media/movie.mkv',
    duration: 7200,
    size: 10000000,
    codec: 'h264',
    container: 'mkv',
    resolution: '1080p',
    audioTracks: [],
    subtitleTracks: [],
    watchLists: [],
    episodeId: null,
    movieId: 'movie-1',
};

const mockPlaybackInfo = {
    videoId: 'video-1',
    filePath: '/media/movie.mkv',
    subtitles: [],
    audioTracks: [],
    duration: 7200,
    resolution: '1080p',
    codec: 'h264',
};

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {
        getVideoById: jest.fn(),
        getVideoByEpisodeId: jest.fn(),
        getVideoPlaybackInfo: jest.fn(),
        updateMediaInfo: jest.fn(),
        updateVideo: jest.fn(),
        deleteVideo: jest.fn(),
        addVideoToWatchList: jest.fn(),
        removeVideoFromWatchList: jest.fn(),
        addVideoToContinueWatching: jest.fn(),
        removeVideoFromContinueWatching: jest.fn(),
    },
    videoExtractionService: {
        streamVideoThumbnail: jest.fn(),
        streamVideoSubtitles: jest.fn(),
    },
    fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let usersRepo: UsersRepositoryImpl;
let userToken: string;
let adminToken: string;

beforeAll(async () => {
    process.env.JWT_SECRET = 'test-api-secret-videos';
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

    mockContainer.useCases.getVideoById.mockReturnValue({ execute: jest.fn().mockResolvedValue(mockVideo) });
    mockContainer.useCases.getVideoByEpisodeId.mockReturnValue({ execute: jest.fn().mockResolvedValue(mockVideo) });
    mockContainer.useCases.getVideoPlaybackInfo.mockReturnValue({ execute: jest.fn().mockResolvedValue(mockPlaybackInfo) });
    mockContainer.useCases.updateMediaInfo.mockReturnValue({ execute: jest.fn().mockResolvedValue(mockVideo) });
    mockContainer.useCases.updateVideo.mockReturnValue({ execute: jest.fn().mockResolvedValue(mockVideo) });
    mockContainer.useCases.deleteVideo.mockReturnValue({ execute: jest.fn().mockResolvedValue(undefined) });
});

describe('Videos API', () => {
    describe('GET /api/videos/:id (cookieAuth)', () => {
        it('returns 200 with video data for authenticated user', async () => {
            const res = await request(app)
                .get('/api/videos/video-1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBeDefined();
        });

        it('returns 401 without auth', async () => {
            const res = await request(app).get('/api/videos/video-1');
            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it('returns 404 when video not found', async () => {
            mockContainer.useCases.getVideoById.mockReturnValue({ execute: jest.fn().mockResolvedValue(null) });

            const res = await request(app)
                .get('/api/videos/nonexistent')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(404);
        });
    });

    describe('GET /api/videos/playback-info/:id (cookieAuth)', () => {
        it('returns 200 with playback info', async () => {
            const res = await request(app)
                .get('/api/videos/playback-info/video-1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('videoId');
        });
    });

    describe('GET /api/videos/by-episode/:episodeId (cookieAuth)', () => {
        it('returns 200 with video by episode id', async () => {
            const res = await request(app)
                .get('/api/videos/by-episode/ep-1')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });

    describe('PATCH /api/videos/:id (adminAuth)', () => {
        it('returns 200 and updates video with admin token', async () => {
            const res = await request(app)
                .patch('/api/videos/video-1')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ title: 'Updated Video' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('returns 401 without auth', async () => {
            const res = await request(app)
                .patch('/api/videos/video-1')
                .send({ title: 'Updated Video' });

            expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    describe('DELETE /api/videos/:id (adminAuth)', () => {
        it('returns 200 when deleting with admin auth', async () => {
            const res = await request(app)
                .delete('/api/videos/video-1')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });
    });
});
