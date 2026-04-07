import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { SeriesController } from '@/api/v1/series/infrastructure/web/controllers/SeriesController';
import { ServersController } from '@/api/v1/servers/infrastructure/web/controllers/ServersController';
import { ServerConfigService } from '@/api/v1/servers/infrastructure/services/ServerConfigService';
import { MediaService } from '@/api/v1/shared/infrastructure/services/MediaService';
import { VideoStreamingController } from '@/api/v1/videos/infrastructure/web/controllers/VideoStreamingController';
import { messages } from '@/config/messages';
import { verifyVideoStreamToken } from '@/middleware/video.middleware';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {
        getSeriesById: jest.fn(),
        getSeasonById: jest.fn(),
        getEpisodeById: jest.fn(),
        getVideoByEpisodeId: jest.fn(),
        addVideoToWatchList: jest.fn(),
        removeVideoFromContinueWatching: jest.fn(),
        removeVideoFromWatchList: jest.fn(),
        updateVideo: jest.fn(),
        addSeasonToWatchList: jest.fn(),
        removeSeasonFromWatchList: jest.fn(),
        updateSeason: jest.fn(),
        addSeriesToWatchList: jest.fn(),
        removeSeriesFromWatchList: jest.fn(),
        updateSeries: jest.fn(),
        refreshSeriesMetadata: jest.fn(),
        updateShowId: jest.fn(),
        updateEpisodeGroup: jest.fn(),
        deleteSeries: jest.fn(),
        getAllUsers: jest.fn(),
        updateServer: jest.fn(),
    },
    externalSearchService: {
        searchTvShows: jest.fn(),
        searchEpisodeGroups: jest.fn(),
    },
    fileSystemService: {
        getExternalPath: jest.fn(),
        createJSONFile: jest.fn(),
        readFileSync: jest.fn(),
        writeFile: jest.fn(),
    },
    tmdbApiClient: {
        THEMOVIEDB_API_TOKEN: '',
        getAPIKeyStatus: jest.fn(),
    },
    videoProcessingService: {
        transcodeAndStreamVideo: jest.fn(),
        streamDirectVideoFile: jest.fn(),
    },
}));

jest.mock('@/api/v1/shared/infrastructure/services/MediaService', () => ({
    MediaService: {
        countRemainingEpisodes: jest.fn(),
    },
}));

jest.mock('@/middleware/video.middleware', () => ({
    verifyVideoStreamToken: jest.fn((_req, _res, next) => next()),
}));

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
}));

const container = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

const asRequest = (input: Partial<Request>) => input as Request;

const useCase = (result?: unknown) => ({ execute: jest.fn().mockResolvedValue(result) });

describe('Servers, Series and Video Streaming controllers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        ServerConfigService.serverConfig = { id: 'server-1', name: 'Seerial' } as never;
        process.env.JWT_SECRET = 'jwt-secret';
    });

    describe('SeriesController', () => {
        it('throws when user id is missing in both request and body', async () => {
            await expect(
                new SeriesController().setWatchState('series-1', { watched: true } as never, asRequest({})),
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        it('throws when target series is not found', async () => {
            container.useCases.getSeriesById.mockReturnValue(useCase(null));

            await expect(
                new SeriesController().setWatchState(
                    'series-1',
                    { watched: true, userId: 'user-1' } as never,
                    asRequest({}),
                ),
            ).rejects.toMatchObject({ statusCode: 404 });
        });

        it('marks nested episodes as watched and updates season and series watch lists', async () => {
            const getSeriesByIdExecute = jest.fn().mockResolvedValue({
                id: 'series-1',
                seasons: [{ id: 'season-1' }],
            });
            const getSeasonByIdExecute = jest.fn().mockResolvedValue({
                id: 'season-1',
                episodes: [{ id: 'episode-1' }],
            });
            const getEpisodeByIdExecute = jest.fn().mockResolvedValue({ id: 'episode-1' });
            const getVideoByEpisodeIdExecute = jest.fn().mockResolvedValue({ id: 'video-1' });
            const addVideoToWatchListExecute = jest.fn().mockResolvedValue(undefined);
            const removeContinueExecute = jest.fn().mockResolvedValue(undefined);
            const updateVideoExecute = jest.fn().mockResolvedValue(undefined);
            const addSeasonExecute = jest.fn().mockResolvedValue(undefined);
            const updateSeasonExecute = jest.fn().mockResolvedValue(undefined);
            const addSeriesExecute = jest.fn().mockResolvedValue(undefined);
            const updateSeriesExecute = jest.fn().mockResolvedValue(undefined);

            container.useCases.getSeriesById.mockReturnValue({ execute: getSeriesByIdExecute });
            container.useCases.getSeasonById.mockReturnValue({ execute: getSeasonByIdExecute });
            container.useCases.getEpisodeById.mockReturnValue({ execute: getEpisodeByIdExecute });
            container.useCases.getVideoByEpisodeId.mockReturnValue({ execute: getVideoByEpisodeIdExecute });
            container.useCases.addVideoToWatchList.mockReturnValue({ execute: addVideoToWatchListExecute });
            container.useCases.removeVideoFromContinueWatching.mockReturnValue({ execute: removeContinueExecute });
            container.useCases.updateVideo.mockReturnValue({ execute: updateVideoExecute });
            container.useCases.addSeasonToWatchList.mockReturnValue({ execute: addSeasonExecute });
            container.useCases.updateSeason.mockReturnValue({ execute: updateSeasonExecute });
            container.useCases.addSeriesToWatchList.mockReturnValue({ execute: addSeriesExecute });
            container.useCases.updateSeries.mockReturnValue({ execute: updateSeriesExecute });

            const response = await new SeriesController().setWatchState(
                'series-1',
                { watched: true } as never,
                asRequest({ user: { id: 'user-1' } } as never),
            );

            expect(response.success).toBe(true);
            expect(addVideoToWatchListExecute).toHaveBeenCalledWith('video-1', 'user-1');
            expect(removeContinueExecute).toHaveBeenCalledWith('video-1', 'user-1');
            expect(addSeasonExecute).toHaveBeenCalledWith('season-1', 'user-1');
            expect(addSeriesExecute).toHaveBeenCalledWith('series-1', 'user-1');
            expect(updateSeriesExecute).toHaveBeenCalledWith('series-1', expect.objectContaining({ id: 'series-1' }));
        });

        it('removes watch-list relations when setting as not watched and tolerates missing seasons', async () => {
            const getSeriesByIdExecute = jest.fn().mockResolvedValue({
                id: 'series-1',
                seasons: [{ id: 'season-1' }],
            });
            const getSeasonByIdExecute = jest.fn().mockResolvedValue(null);
            const removeSeriesExecute = jest.fn().mockResolvedValue(undefined);

            container.useCases.getSeriesById.mockReturnValue({ execute: getSeriesByIdExecute });
            container.useCases.getSeasonById.mockReturnValue({ execute: getSeasonByIdExecute });
            container.useCases.removeSeriesFromWatchList.mockReturnValue({ execute: removeSeriesExecute });
            container.useCases.updateSeries.mockReturnValue(useCase(undefined));

            const response = await new SeriesController().setWatchState(
                'series-1',
                { watched: false, userId: 'user-1' } as never,
                asRequest({}),
            );

            expect(response.message).toBe(messages.success.update);
            expect(removeSeriesExecute).toHaveBeenCalledWith('series-1', 'user-1');
            expect(container.useCases.removeSeasonFromWatchList).not.toHaveBeenCalled();
        });

        it('returns remaining episodes count for authenticated user', async () => {
            (MediaService.countRemainingEpisodes as jest.Mock).mockResolvedValue(5);

            const response = await new SeriesController().getRemainingEpisodes(
                'series-1',
                asRequest({ user: { id: 'user-1' } } as never),
            );

            expect(MediaService.countRemainingEpisodes).toHaveBeenCalledWith('series-1', 'user-1');
            expect(response.data).toBe(5);
        });
    });

    describe('ServersController', () => {
        it('returns invalid api key status when token is missing', async () => {
            container.tmdbApiClient.THEMOVIEDB_API_TOKEN = '';
            container.useCases.getAllUsers.mockReturnValue(useCase([{ id: 'user-1' }]));

            const response = await new ServersController().getServerStatus();

            expect(container.tmdbApiClient.getAPIKeyStatus).not.toHaveBeenCalled();
            expect(response.data).toEqual({
                id: 'server-1',
                name: 'Seerial',
                status: 'INVALID_API_KEY',
                users: [{ id: 'user-1' }],
            });
        });

        it('returns valid api key status when token is set and validated', async () => {
            container.tmdbApiClient.THEMOVIEDB_API_TOKEN = 'tmdb-token';
            container.tmdbApiClient.getAPIKeyStatus.mockResolvedValue(true);
            container.useCases.getAllUsers.mockReturnValue(useCase([]));

            const response = await new ServersController().getServerStatus();

            expect(container.tmdbApiClient.getAPIKeyStatus).toHaveBeenCalled();
            expect(response.data?.status).toBe('VALID_API_KEY');
        });

        it('reads a single config key and returns null when key is missing', async () => {
            container.fileSystemService.getExternalPath.mockReturnValue('/tmp/serverConfig.json');
            container.fileSystemService.readFileSync.mockReturnValue(JSON.stringify({ autoScan: true }));

            const response = await new ServersController().getServerConfigKey('unknownKey');

            expect(container.fileSystemService.createJSONFile).toHaveBeenCalled();
            expect(response.data).toEqual({ key: 'unknownKey', value: null });
        });

        it('merges and persists updated server config values', async () => {
            container.fileSystemService.getExternalPath.mockReturnValue('/tmp/serverConfig.json');
            container.fileSystemService.readFileSync.mockReturnValue(
                JSON.stringify({ autoScan: false, transcodeBuffer: 60 }),
            );

            const response = await new ServersController().updateServerConfig({
                autoScan: true,
                transcodeBuffer: 120,
            } as never);

            expect(container.fileSystemService.writeFile).toHaveBeenCalledWith(
                '/tmp/serverConfig.json',
                JSON.stringify({ autoScan: true, transcodeBuffer: 120 }, null, 2),
            );
            expect(response.data).toEqual({ autoScan: true, transcodeBuffer: 120 });
        });
    });

    describe('VideoStreamingController', () => {
        it('builds a signed transcoded URL with default values', async () => {
            (jwt.sign as jest.Mock).mockReturnValue('signed-token');

            const response = await new VideoStreamingController().getStreamUrl(
                { filePath: '/media/movie.mkv' } as never,
                asRequest({ user: { id: 'user-1' } } as never),
            );

            expect(jwt.sign).toHaveBeenCalledWith(
                {
                    userId: 'user-1',
                    path: '/media/movie.mkv',
                    start: 0,
                    audio: 0,
                    quality: '0',
                    bitrate: 0,
                },
                'jwt-secret',
                { expiresIn: '2m' },
            );
            expect(response.data).toBe('/video-streaming/transcoded?token=signed-token');
        });

        it('builds a passthrough URL honoring explicit expiration', async () => {
            (jwt.sign as jest.Mock).mockReturnValue('signed-passthrough');

            const response = await new VideoStreamingController().getVideoUrl(
                { filePath: '/media/episode.mkv', expiresIn: '5m' } as never,
                asRequest({ user: { id: 'user-2' } } as never),
            );

            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 'user-2', path: '/media/episode.mkv' },
                'jwt-secret',
                { expiresIn: '5m' },
            );
            expect(response.data).toBe('/video-streaming/passthrough?token=signed-passthrough');
        });

        it('throws when streaming response is unavailable', async () => {
            await expect(new VideoStreamingController().streamVideo(asRequest({}))).rejects.toThrow(
                'Streaming response object is not available',
            );
        });

        it('streams transcoded video after middleware succeeds', async () => {
            const req = asRequest({
                res: {} as never,
                videoParams: { path: '/tmp/file.mkv' } as never,
            } as never);

            await new VideoStreamingController().streamVideo(req);

            expect(verifyVideoStreamToken).toHaveBeenCalled();
            expect(container.videoProcessingService.transcodeAndStreamVideo).toHaveBeenCalledWith(
                { path: '/tmp/file.mkv' },
                req.res,
            );
        });

        it('propagates middleware errors in passthrough streaming', async () => {
            (verifyVideoStreamToken as jest.Mock).mockImplementationOnce((_req, _res, next) =>
                next(new Error('invalid token')),
            );

            await expect(
                new VideoStreamingController().streamVideoFile(asRequest({ res: {} as never } as never)),
            ).rejects.toThrow('invalid token');
            expect(container.videoProcessingService.streamDirectVideoFile).not.toHaveBeenCalled();
        });
    });
});
