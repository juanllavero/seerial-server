import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import childProcess from 'node:child_process';
import { APIKeyController } from '@/api/v1/shared/infrastructure/web/controllers/APIKeyController';
import { SearchController } from '@/api/v1/shared/infrastructure/web/controllers/SearchController';
import { DownloadController } from '@/api/v1/shared/infrastructure/web/controllers/DownloadController';
import { FilesController } from '@/api/v1/shared/infrastructure/web/controllers/FilesController';
import { HealthController } from '@/api/v1/shared/infrastructure/web/controllers/HealthController';
import { MediaController } from '@/api/v1/shared/infrastructure/web/controllers/MediaController';
import { ContinueWatchingController } from '@/api/v1/watch-lists/infrastructure/web/controllers/ContinueWatchingController';
import { messages } from '@/config/messages';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    fileSystemService: {
        getExternalPath: jest.fn(),
        isFolder: jest.fn(),
        propertiesFilePath: '/tmp/app.properties',
        resourcesPath: '/resources',
    },
    tmdbApiClient: {
        THEMOVIEDB_API_TOKEN: 'token',
        initialize: jest.fn(),
        getAPIKeyStatus: jest.fn(),
    },
    downloaderService: {
        downloadVideo: jest.fn(),
        downloadAudio: jest.fn(),
    },
    externalSearchService: {
        searchDownloadableMedia: jest.fn(),
    },
    useCases: {
        getContinueWatchingVideos: jest.fn(),
    },
}));

jest.mock('@/utils/auth', () => ({
    getUserId: jest.fn(() => 'user-1'),
}));

jest.mock('@/api/v1/servers/infrastructure/persistence/models/ServerModel', () => ({
    ServerModel: {
        find: jest.fn(),
    },
}));

jest.mock('@/api/v1/shared/infrastructure/services/SanitizationService', () => ({
    sanitizeDirectoryPath: jest.fn((p) => p),
    getSystemAllowedPaths: jest.fn(() => ['/']),
}));

jest.mock('@/api/v1/shared/infrastructure/services/MediaDetailsService', () => ({
    getDetails: jest.fn(),
    findMediaBackground: jest.fn(),
    findMusicExtras: jest.fn(),
}));

jest.mock('properties-reader', () =>
    jest.fn(() => ({
        set: jest.fn(),
        save: jest.fn(),
    })),
);

jest.mock('@/utils/utils', () => ({
    isValidURL: jest.fn(),
    downloadImage: jest.fn(),
}));

const container = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');
const { ServerModel } = jest.requireMock('@/api/v1/servers/infrastructure/persistence/models/ServerModel');
const sanitizationService = jest.requireMock('@/api/v1/shared/infrastructure/services/SanitizationService');
const mediaDetailsService = jest.requireMock('@/api/v1/shared/infrastructure/services/MediaDetailsService');
const propertiesReader = jest.requireMock('properties-reader') as jest.Mock;
const utils = jest.requireMock('@/utils/utils');
const authUtils = jest.requireMock('@/utils/auth');

describe('Shared controllers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        container.fileSystemService.getExternalPath.mockReturnValue('/resources');
        container.fileSystemService.isFolder.mockReturnValue(true);
        ServerModel.find.mockResolvedValue([]);
        container.tmdbApiClient.getAPIKeyStatus.mockResolvedValue(true);
        container.tmdbApiClient.initialize.mockResolvedValue(true);
        container.tmdbApiClient.THEMOVIEDB_API_TOKEN = 'token';
        utils.isValidURL.mockReturnValue(true);
        mediaDetailsService.getDetails.mockResolvedValue({ id: '1' });
        mediaDetailsService.findMediaBackground.mockResolvedValue({ background: 'ok' });
        container.externalSearchService.searchDownloadableMedia.mockResolvedValue([{ id: 'result-1' }]);
        container.useCases.getContinueWatchingVideos.mockReturnValue({
            execute: jest.fn().mockResolvedValue([{ videoId: 'video-1' }]),
        });
    });

    describe('HealthController', () => {
        it('returns ok status when all checks pass', async () => {
            jest.spyOn(childProcess, 'exec').mockImplementation(((_command, cb) => {
                cb?.(null);
                return {} as never;
            }) as never);

            const response = await new HealthController().health();

            expect(response.success).toBe(true);
            expect(response.data?.status).toBe('ok');
            expect(response.data?.checks).toEqual({
                filesystem: 'ok',
                database: 'ok',
                ffmpeg: 'ok',
                tmdb: 'ok',
            });
        });

        it('returns degraded/down statuses when dependencies fail', async () => {
            container.fileSystemService.isFolder.mockImplementation(() => {
                throw new Error('filesystem down');
            });
            ServerModel.find.mockRejectedValue(new Error('db down'));
            container.tmdbApiClient.THEMOVIEDB_API_TOKEN = '';
            jest.spyOn(childProcess, 'exec').mockImplementation(((_command, cb) => {
                cb?.(new Error('missing ffmpeg'));
                return {} as never;
            }) as never);

            const response = await new HealthController().health();

            expect(response.data?.checks.filesystem).toBe('down');
            expect(response.data?.checks.database).toBe('down');
            expect(response.data?.checks.ffmpeg).toBe('degraded');
            expect(response.data?.checks.tmdb).toBe('degraded');
            expect(response.data?.status).toBe('down');
        });
    });

    describe('FilesController', () => {
        it('returns drives including home and root directories', async () => {
            const drives = await new FilesController().getDrives();

            expect(drives.success).toBe(true);
            expect(drives.data?.length).toBeGreaterThan(0);
            expect(drives.data?.[0]).toBe(os.homedir());
        });

        it('returns sorted folder contents excluding hidden items', async () => {
            const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'files-controller-'));
            fs.mkdirSync(path.join(tmpDir, 'B-folder'));
            fs.mkdirSync(path.join(tmpDir, '.hidden-folder'));
            fs.writeFileSync(path.join(tmpDir, 'a-file.txt'), 'a');
            fs.writeFileSync(path.join(tmpDir, '.hidden-file'), 'x');
            sanitizationService.sanitizeDirectoryPath.mockReturnValue(tmpDir);

            const result = await new FilesController().getFolderContents(tmpDir);

            expect(result.data).toEqual([
                { name: 'B-folder', isFolder: true },
                { name: 'a-file.txt', isFolder: false },
            ]);
        });
    });

    describe('APIKeyController', () => {
        it('returns error when api key is empty', async () => {
            const response = await new APIKeyController().configureApiKey({ apiKey: '' });

            expect(response.success).toBe(false);
            expect(response.data).toEqual({ status: 'INVALID_API_KEY' });
        });

        it('initializes tmdb and returns valid status for api key', async () => {
            container.tmdbApiClient.initialize.mockResolvedValue(true);

            const response = await new APIKeyController().configureApiKey({ apiKey: 'abc123' });

            expect(propertiesReader).toHaveBeenCalledWith(container.fileSystemService.propertiesFilePath);
            expect(container.tmdbApiClient.initialize).toHaveBeenCalled();
            expect(container.tmdbApiClient.THEMOVIEDB_API_TOKEN).toBe('abc123');
            expect(response.data).toEqual({ status: 'VALID_API_KEY' });
        });
    });

    describe('DownloadController', () => {
        it('delegates video and music downloads to downloader service', async () => {
            const controller = new DownloadController();

            await controller.downloadVideo({
                url: 'https://example.com/video',
                downloadFolder: 'videos',
                fileName: 'video.mp4',
            });
            await controller.downloadMusic({
                url: 'https://example.com/audio',
                downloadFolder: 'music',
                fileName: 'song.mp3',
            });

            expect(container.downloaderService.downloadVideo).toHaveBeenCalledWith(
                'https://example.com/video',
                'videos',
                'video.mp4',
            );
            expect(container.downloaderService.downloadAudio).toHaveBeenCalledWith(
                'https://example.com/audio',
                'music',
                'song.mp3',
            );
        });

        it('validates and downloads image with extension fallback', async () => {
            const controller = new DownloadController();

            const response = await controller.downloadImage({
                url: 'https://example.com/image',
                downloadFolder: 'img',
                fileName: 'cover',
            });

            expect(utils.downloadImage).toHaveBeenCalledWith(
                'https://example.com/image',
                path.join('/resources', 'img', 'cover.jpg'),
            );
            expect(response.message).toBe(messages.success.download);
        });

        it('throws for invalid image url', async () => {
            utils.isValidURL.mockReturnValue(false);

            await expect(
                new DownloadController().downloadImage({
                    url: 'invalid-url',
                    downloadFolder: 'img',
                    fileName: 'cover',
                }),
            ).rejects.toMatchObject({ statusCode: 400 });
        });
    });

    describe('MediaController', () => {
        it('returns media details and media background for valid types', async () => {
            const controller = new MediaController();

            const details = await controller.getDetails('movie', 'movie-1');
            const background = await controller.getMediaBackground('movie', 'video', 'movie-1');

            expect(details.success).toBe(true);
            expect(mediaDetailsService.getDetails).toHaveBeenCalledWith('movie', 'movie-1');
            expect(background.success).toBe(true);
            expect(mediaDetailsService.findMediaBackground).toHaveBeenCalledWith('video', 'movie', 'movie-1');
        });

        it('throws when itemType or mediaType are invalid', async () => {
            const controller = new MediaController();

            await expect(controller.getMediaBackground('album', 'video', 'id-1')).rejects.toMatchObject({
                statusCode: 400,
            });
            await expect(controller.getMediaBackground('movie', 'book', 'id-1')).rejects.toThrow(
                "Invalid mediaType. Must be 'video' or 'music'.",
            );
        });
    });

    describe('ContinueWatchingController', () => {
        it('returns continue-watching videos for authenticated user', async () => {
            const req = { user: { id: 'user-1' } };

            const response = await new ContinueWatchingController().getVideos(req as never);

            expect(authUtils.getUserId).toHaveBeenCalledWith(req);
            expect(container.useCases.getContinueWatchingVideos).toHaveBeenCalled();
            expect(response.success).toBe(true);
            expect(response.data).toEqual([{ videoId: 'video-1' }]);
        });
    });

    describe('SearchController', () => {
        it('returns search results from external search service', async () => {
            const response = await new SearchController().searchDownloadableMedia('interstellar trailer');

            expect(container.externalSearchService.searchDownloadableMedia).toHaveBeenCalledWith(
                'interstellar trailer',
            );
            expect(response.success).toBe(true);
            expect(response.data).toEqual([{ id: 'result-1' }]);
        });
    });
});
