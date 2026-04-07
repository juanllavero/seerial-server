import type { EpisodeRepositoryPort } from '@/api/v1/episodes/application/ports/EpisodeRepositoryPort';
import { CreateEpisodeUseCase } from '@/api/v1/episodes/application/usecases/CreateEpisodeUseCase';
import { DeleteEpisodeUseCase } from '@/api/v1/episodes/application/usecases/DeleteEpisodeUseCase';
import { FindEpisodeByIdUseCase } from '@/api/v1/episodes/application/usecases/FindEpisodeByIdUseCase';
import { FindEpisodeByPathUseCase } from '@/api/v1/episodes/application/usecases/FindEpisodeByPathUseCase';
import { FindEpisodesBySeasonIdUseCase } from '@/api/v1/episodes/application/usecases/FindEpisodesBySeasonIdUseCase';
import { SetEpisodeWatchStateUseCase } from '@/api/v1/episodes/application/usecases/SetEpisodeWatchStateUseCase';
import { UpdateEpisodeUseCase } from '@/api/v1/episodes/application/usecases/UpdateEpisodeUseCase';
import type { Episode } from '@/api/v1/episodes/domain/Episode';
import type { SeasonsRepositoryPort } from '@/api/v1/seasons/application/ports/SeasonsRepositoryPort';
import type { SeriesRepositoryPort } from '@/api/v1/series/application/ports/SeriesRepositoryPort';
import type { VideoRepositoryPort } from '@/api/v1/videos/application/ports/VideosRepositoryPort';
import type { WatchListRepositoryPort } from '@/api/v1/watch-lists/application/ports/WatchListRepositoryPort';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {
        deleteVideo: jest.fn(),
    },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container') as {
    useCases: {
        deleteVideo: jest.Mock;
    };
};

function buildEpisode(overrides: Partial<Episode> = {}): Episode {
    return {
        id: 'episode-1',
        seasonId: 'season-1',
        episodeNumber: 1,
        title: 'Pilot',
        video: { id: 'video-1' } as never,
        ...overrides,
    } as unknown as Episode;
}

function buildEpisodeRepo(overrides: Partial<EpisodeRepositoryPort> = {}): EpisodeRepositoryPort {
    return {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findAllBySeasonId: jest.fn(),
        findById: jest.fn(),
        findByVideoSrc: jest.fn(),
        ...overrides,
    };
}

function buildSeasonRepo(overrides: Partial<SeasonsRepositoryPort> = {}): SeasonsRepositoryPort {
    return {
        findAll: jest.fn(),
        findById: jest.fn(),
        findSeasonsBySeriesId: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        ...overrides,
    } as SeasonsRepositoryPort;
}

function buildSeriesRepo(overrides: Partial<SeriesRepositoryPort> = {}): SeriesRepositoryPort {
    return {
        findAll: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        ...overrides,
    } as SeriesRepositoryPort;
}

function buildVideoRepo(overrides: Partial<VideoRepositoryPort> = {}): VideoRepositoryPort {
    return {
        findById: jest.fn(),
        findByEpisodeId: jest.fn(),
        findByMovieId: jest.fn(),
        findByExtraId: jest.fn(),
        findByPath: jest.fn(),
        getVideoPlaybackInfo: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        addAsMovie: jest.fn(),
        addAsMovieExtra: jest.fn(),
        addAsEpisode: jest.fn(),
        ...overrides,
    } as VideoRepositoryPort;
}

function buildWatchListRepo(overrides: Partial<WatchListRepositoryPort> = {}): WatchListRepositoryPort {
    return {
        findByVideoId: jest.fn(),
        findByVideoIdAndUserId: jest.fn(),
        findById: jest.fn(),
        findCurrentSeason: jest.fn(),
        findCurrentEpisode: jest.fn(),
        findCurrentVideo: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        addSeries: jest.fn(),
        removeSeries: jest.fn(),
        addSeason: jest.fn(),
        removeSeason: jest.fn(),
        addEpisode: jest.fn(),
        removeEpisode: jest.fn(),
        addMovie: jest.fn(),
        removeMovie: jest.fn(),
        addVideo: jest.fn(),
        removeVideo: jest.fn(),
        isVideoWatched: jest.fn(),
        isSeriesWatched: jest.fn(),
        isMovieWatched: jest.fn(),
        isSeasonWatched: jest.fn(),
        isEpisodeWatched: jest.fn(),
        getContinueWatchingVideos: jest.fn(),
        addContinueWatchingVideo: jest.fn(),
        removeContinueWatchingVideo: jest.fn(),
        clearContinueWatching: jest.fn(),
        ...overrides,
    };
}

describe('Episode use cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockContainer.useCases.deleteVideo.mockReturnValue({ execute: jest.fn().mockResolvedValue(undefined) });
    });

    describe('CreateEpisodeUseCase', () => {
        it('creates an episode through the repository', async () => {
            const episode = buildEpisode();
            const repo = buildEpisodeRepo({ create: jest.fn().mockResolvedValue(episode) });

            const result = await new CreateEpisodeUseCase(repo).execute({ title: 'Pilot' } as never);

            expect(result).toEqual(episode);
            expect(repo.create).toHaveBeenCalledWith({ title: 'Pilot' });
        });
    });

    describe('FindEpisodeByIdUseCase', () => {
        it('returns an episode by id', async () => {
            const episode = buildEpisode();
            const repo = buildEpisodeRepo({ findById: jest.fn().mockResolvedValue(episode) });

            const result = await new FindEpisodeByIdUseCase(repo).execute(episode.id);

            expect(result).toEqual(episode);
            expect(repo.findById).toHaveBeenCalledWith(episode.id);
        });
    });

    describe('FindEpisodeByPathUseCase', () => {
        it('returns an episode by video source path', async () => {
            const episode = buildEpisode();
            const repo = buildEpisodeRepo({ findByVideoSrc: jest.fn().mockResolvedValue(episode) });

            const result = await new FindEpisodeByPathUseCase(repo).execute('/shows/show/pilot.mkv');

            expect(result).toEqual(episode);
            expect(repo.findByVideoSrc).toHaveBeenCalledWith('/shows/show/pilot.mkv');
        });
    });

    describe('FindEpisodesBySeasonIdUseCase', () => {
        it('returns episodes for a season', async () => {
            const episodes = [buildEpisode(), buildEpisode({ id: 'episode-2', episodeNumber: 2 })];
            const repo = buildEpisodeRepo({ findAllBySeasonId: jest.fn().mockResolvedValue(episodes) });

            const result = await new FindEpisodesBySeasonIdUseCase(repo).execute('season-1');

            expect(result).toEqual(episodes);
            expect(repo.findAllBySeasonId).toHaveBeenCalledWith('season-1');
        });
    });

    describe('UpdateEpisodeUseCase', () => {
        it('updates an episode through the repository', async () => {
            const episode = buildEpisode({ title: 'Updated Pilot' });
            const repo = buildEpisodeRepo({ update: jest.fn().mockResolvedValue(episode) });

            const result = await new UpdateEpisodeUseCase(repo).execute('episode-1', { title: 'Updated Pilot' } as never);

            expect(result).toEqual(episode);
            expect(repo.update).toHaveBeenCalledWith('episode-1', { title: 'Updated Pilot' });
        });
    });

    describe('DeleteEpisodeUseCase', () => {
        it('throws when the episode does not exist', async () => {
            const repo = buildEpisodeRepo({ findById: jest.fn().mockResolvedValue(null) });

            await expect(new DeleteEpisodeUseCase(repo).execute('missing')).rejects.toMatchObject({ statusCode: 404 });
        });

        it('deletes the associated video before deleting the episode', async () => {
            const episode = buildEpisode();
            const deleteVideoExecute = jest.fn().mockResolvedValue(undefined);
            mockContainer.useCases.deleteVideo.mockReturnValue({ execute: deleteVideoExecute });
            const repo = buildEpisodeRepo({
                findById: jest.fn().mockResolvedValue(episode),
                delete: jest.fn().mockResolvedValue(undefined),
            });

            await new DeleteEpisodeUseCase(repo).execute('episode-1');

            expect(deleteVideoExecute).toHaveBeenCalledWith('video-1');
            expect(repo.delete).toHaveBeenCalledWith('episode-1');
        });
    });

    describe('SetEpisodeWatchStateUseCase', () => {
        it('throws when the target episode does not exist', async () => {
            const episodeRepo = buildEpisodeRepo({ findById: jest.fn().mockResolvedValue(null) });

            await expect(
                new SetEpisodeWatchStateUseCase(
                    episodeRepo,
                    buildSeasonRepo(),
                    buildSeriesRepo(),
                    buildVideoRepo(),
                    buildWatchListRepo(),
                ).execute('missing', 'user-1', true),
            ).rejects.toMatchObject({ statusCode: 404 });
        });

        it('marks a one-episode season as watched and advances series state', async () => {
            const episode = buildEpisode();
            const episodeRepo = buildEpisodeRepo({
                findById: jest
                    .fn()
                    .mockResolvedValueOnce(episode)
                    .mockResolvedValueOnce(episode),
            });
            const seasonRepo = buildSeasonRepo({
                findById: jest
                    .fn()
                    .mockResolvedValueOnce({ id: 'season-1', seriesId: 'series-1', seasonNumber: 1 })
                    .mockResolvedValueOnce({
                        id: 'season-1',
                        seriesId: 'series-1',
                        seasonNumber: 1,
                        episodes: [{ id: 'episode-1' }],
                    }),
            });
            const seriesRepo = buildSeriesRepo({
                findById: jest.fn().mockResolvedValue({ id: 'series-1', seasons: [{ id: 'season-1' }] }),
            });
            const videoRepo = buildVideoRepo({
                findByEpisodeId: jest.fn().mockResolvedValue({ id: 'video-1' }),
            });
            const watchListRepo = buildWatchListRepo({
                addVideo: jest.fn().mockResolvedValue(undefined),
                isVideoWatched: jest.fn().mockResolvedValue(true),
                addSeason: jest.fn().mockResolvedValue(undefined),
                removeSeason: jest.fn().mockResolvedValue(true),
                clearContinueWatching: jest.fn().mockResolvedValue(true),
                addSeries: jest.fn().mockResolvedValue(undefined),
            });

            await new SetEpisodeWatchStateUseCase(
                episodeRepo,
                seasonRepo,
                seriesRepo,
                videoRepo,
                watchListRepo,
            ).execute('episode-1', 'user-1', true);

            expect(watchListRepo.addVideo).toHaveBeenCalledWith('user-1', 'video-1');
            expect(watchListRepo.addSeason).toHaveBeenCalledWith('user-1', 'season-1');
            expect(watchListRepo.clearContinueWatching).toHaveBeenCalledWith('user-1', 'series-1');
            expect(watchListRepo.addSeries).toHaveBeenCalledWith('user-1', 'series-1');
        });
    });
});