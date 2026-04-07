import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {},
    videoProcessingService: {
        transcode: jest.fn(),
        passthrough: jest.fn(),
    },
    fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

let app: Express;
let usersRepo: UsersRepositoryImpl;
let userToken: string;
let adminToken: string;

beforeAll(async () => {
    process.env.JWT_SECRET = 'test-api-secret-streaming';
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
});

describe('Video Streaming API (Phase 2D)', () => {
    describe('POST /api/video-streaming/passthrough-url (cookieAuth)', () => {
        it('returns 200 with a signed URL for authenticated user', async () => {
            const res = await request(app)
                .post('/api/video-streaming/passthrough-url')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ filePath: '/media/movie.mkv' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(typeof res.body.data).toBe('string');
            expect(res.body.data).toContain('/video-streaming/passthrough');
            expect(res.body.data).toContain('token=');
        });

        it('returns a JWT token in the URL', async () => {
            const res = await request(app)
                .post('/api/video-streaming/passthrough-url')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ filePath: '/media/test.mkv', expiresIn: '5m' });

            expect(res.status).toBe(200);
            const url = res.body.data as string;
            const params = new URLSearchParams(url.split('?')[1]);
            const token = params.get('token');
            expect(token).toBeTruthy();

            // Verify the token is a valid JWT
            const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as Record<string, unknown>;
            expect(decoded).toHaveProperty('path', '/media/test.mkv');
        });

        it('returns 401 without auth token', async () => {
            const res = await request(app)
                .post('/api/video-streaming/passthrough-url')
                .send({ filePath: '/media/movie.mkv' });

            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('POST /api/video-streaming/transcoded-url (cookieAuth)', () => {
        it('returns 200 with a signed transcoded URL', async () => {
            const res = await request(app)
                .post('/api/video-streaming/transcoded-url')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ filePath: '/media/movie.mkv', quality: '1080p', bitrate: 5000 });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toContain('/video-streaming/transcoded');
            expect(res.body.data).toContain('token=');
        });

        it('returns a JWT with streaming params in the URL', async () => {
            const res = await request(app)
                .post('/api/video-streaming/transcoded-url')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ filePath: '/media/test.mkv', start: 120, audio: 1, quality: '720p', bitrate: 3000 });

            expect(res.status).toBe(200);
            const url = res.body.data as string;
            const params = new URLSearchParams(url.split('?')[1]);
            const token = params.get('token');
            const decoded = jwt.verify(token!, process.env.JWT_SECRET!) as Record<string, unknown>;
            expect(decoded).toHaveProperty('path', '/media/test.mkv');
            expect(decoded).toHaveProperty('start', 120);
            expect(decoded).toHaveProperty('audio', 1);
        });

        it('returns 401 without auth', async () => {
            const res = await request(app)
                .post('/api/video-streaming/transcoded-url')
                .send({ filePath: '/media/movie.mkv' });

            expect(res.status).toBeGreaterThanOrEqual(400);
        });

        it('returns 403 for non-admin trying admin-auth endpoints elsewhere but passes cookieAuth here', async () => {
            // cookieAuth accepts any authenticated user, including non-admins
            const res = await request(app)
                .post('/api/video-streaming/transcoded-url')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ filePath: '/media/movie.mkv' });

            expect(res.status).toBe(200);
        });
    });
});
