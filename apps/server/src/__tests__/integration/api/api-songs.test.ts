import 'reflect-metadata';
import type { Express } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { UsersRepositoryImpl } from '@/api/v1/users/infrastructure/persistence/repositories/UsersRepositoryImpl';
import { UserType } from '@/utils/constants';
import { createTestApp } from '../../helpers/app-factory';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

const mockSong = {
  id: 'song-1',
  title: 'Test Song',
  fileSrc: '/music/test-song.mp3',
  duration: 180,
  albumId: 'album-1',
};

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    updateSong: jest.fn(),
    deleteSong: jest.fn(),
    getSongById: jest.fn(),
    startSongStemSeparation: jest.fn(),
  },
  fileSystemService: {
    getExternalPath: jest.fn().mockReturnValue('/test'),
    dirname: jest.fn().mockReturnValue('/music'),
    basename: jest.fn().mockReturnValue('test-song'),
    extname: jest.fn().mockReturnValue('.mp3'),
    join: jest.fn().mockReturnValue('/music/test-song.en.lrc'),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
  audioProcessingService: {
    getStreamableAudioPath: jest.fn(),
    streamFile: jest.fn(),
  },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

let app: Express;
let usersRepo: UsersRepositoryImpl;
let userToken: string;
let adminToken: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-api-secret-songs';
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

  const admin = await usersRepo.create({
    username: 'admin',
    password: 'Admin123!',
    type: UserType.ADMIN,
  });
  adminToken = jwt.sign({ userId: admin.id, type: admin.type }, process.env.JWT_SECRET || '', {
    expiresIn: '1h',
  });

  mockContainer.useCases.updateSong.mockReturnValue({
    execute: jest.fn().mockResolvedValue(mockSong),
  });
  mockContainer.useCases.deleteSong.mockReturnValue({
    execute: jest.fn().mockResolvedValue(undefined),
  });
  mockContainer.useCases.getSongById.mockReturnValue({
    execute: jest.fn().mockResolvedValue(mockSong),
  });
  mockContainer.useCases.startSongStemSeparation.mockReturnValue({
    execute: jest.fn().mockResolvedValue({
      jobId: 'job-1',
      songId: mockSong.id,
      inputPath: mockSong.fileSrc,
      instrumentalPath: '/music/test-song.inst.flac',
      vocalsPath: '/music/test-song.vocals.flac',
      status: 'queued',
    }),
  });
});

describe('Songs API', () => {
  it('PATCH /api/songs/:id returns 200 for admin', async () => {
    const res = await request(app)
      .patch('/api/songs/song-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Updated Song' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('DELETE /api/songs/:id returns 200 for admin', async () => {
    const res = await request(app)
      .delete('/api/songs/song-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/songs/stream-url returns signed URL for authenticated user', async () => {
    const res = await request(app)
      .post('/api/songs/stream-url')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ filePath: '/music/test-song.mp3', expiresIn: '5m' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data).toBe('string');
    expect(res.body.data).toContain('/songs/stream?token=');
  });

  it('POST /api/songs/lyrics returns 200 for admin', async () => {
    const res = await request(app)
      .post('/api/songs/lyrics')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ songId: 'song-1', language: 'en', content: 'Hello world' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('POST /api/songs/:id/separate-stems returns 202 for admin', async () => {
    const res = await request(app)
      .post('/api/songs/song-1/separate-stems')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobId).toBe('job-1');
  });
});
