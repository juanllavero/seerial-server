import type { ContinueWatchingVideoDTO } from '@seerial/domain';
import type { WatchListRepositoryPort } from '@/api/v1/watch-lists/application/ports/WatchListRepositoryPort';
import { AddContinueWatchingVideoUseCase } from '@/api/v1/watch-lists/application/usecases/AddContinueWatchingVideoUseCase';
import { ClearContinueWatchingUseCase } from '@/api/v1/watch-lists/application/usecases/ClearContinueWatchingUseCase';
import { GetContinueWatchingVideosUseCase } from '@/api/v1/watch-lists/application/usecases/GetContinueWatchingVideosUseCase';
import { RemoveContinueWatchingVideoUseCase } from '@/api/v1/watch-lists/application/usecases/RemoveContinueWatchingVideoUseCase';
import { UpdateWatchStateUseCase } from '@/api/v1/watch-lists/application/usecases/UpdateWatchStateUseCase';
import type { WatchList } from '@/api/v1/watch-lists/domain/WatchList';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {
        getVideoById: jest.fn(),
        getEpisodeById: jest.fn(),
        getSeasonById: jest.fn(),
        getMoviebyId: jest.fn(),
        setEpisodeWatchState: jest.fn(),
        addVideoToContinueWatching: jest.fn(),
        removeVideoFromContinueWatching: jest.fn(),
    },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container') as {
    useCases: {
        getVideoById: jest.Mock;
        getEpisodeById: jest.Mock;
        getSeasonById: jest.Mock;
        getMoviebyId: jest.Mock;
        setEpisodeWatchState: jest.Mock;
        addVideoToContinueWatching: jest.Mock;
        removeVideoFromContinueWatching: jest.Mock;
    };
};

function buildWatchList(overrides: Partial<WatchList> = {}): WatchList {
    return {
        id: 'watch-list-1',
        userId: 'user-1',
        watched: false,
        timeWatched: 0,
        ...overrides,
    } as unknown as WatchList;
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

describe('Watch-list use cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockContainer.useCases.getVideoById.mockReturnValue({ execute: jest.fn() });
        mockContainer.useCases.getEpisodeById.mockReturnValue({ execute: jest.fn() });
        mockContainer.useCases.getSeasonById.mockReturnValue({ execute: jest.fn() });
        mockContainer.useCases.getMoviebyId.mockReturnValue({ execute: jest.fn() });
        mockContainer.useCases.setEpisodeWatchState.mockReturnValue({ execute: jest.fn() });
        mockContainer.useCases.addVideoToContinueWatching.mockReturnValue({ execute: jest.fn() });
        mockContainer.useCases.removeVideoFromContinueWatching.mockReturnValue({ execute: jest.fn() });
    });

    describe('AddContinueWatchingVideoUseCase', () => {
        it('adds a continue-watching entry through the repository', async () => {
            const watchList = buildWatchList();
            const repo = buildWatchListRepo({ addContinueWatchingVideo: jest.fn().mockResolvedValue(watchList) });

            const result = await new AddContinueWatchingVideoUseCase(repo).execute('video-1', 'user-1', 'series-1');

            expect(result).toEqual(watchList);
            expect(repo.addContinueWatchingVideo).toHaveBeenCalledWith('video-1', 'user-1', 'series-1', undefined);
        });
    });

    describe('RemoveContinueWatchingVideoUseCase', () => {
        it('removes a continue-watching entry through the repository', async () => {
            const repo = buildWatchListRepo({ removeContinueWatchingVideo: jest.fn().mockResolvedValue(undefined) });

            await new RemoveContinueWatchingVideoUseCase(repo).execute('video-1', 'user-1');

            expect(repo.removeContinueWatchingVideo).toHaveBeenCalledWith('video-1', 'user-1');
        });
    });

    describe('ClearContinueWatchingUseCase', () => {
        it('clears continue-watching entries through the repository', async () => {
            const repo = buildWatchListRepo({ clearContinueWatching: jest.fn().mockResolvedValue(true) });

            await expect(new ClearContinueWatchingUseCase(repo).execute('user-1', 'series-1')).resolves.toBe(true);
            expect(repo.clearContinueWatching).toHaveBeenCalledWith('user-1', 'series-1', undefined);
        });
    });

    describe('GetContinueWatchingVideosUseCase', () => {
        it('returns continue-watching videos for a user', async () => {
            const videos = [{ videoId: 'video-1' }] as ContinueWatchingVideoDTO[];
            const repo = buildWatchListRepo({ getContinueWatchingVideos: jest.fn().mockResolvedValue(videos) });

            const result = await new GetContinueWatchingVideosUseCase(repo).execute('user-1');

            expect(result).toEqual(videos);
            expect(repo.getContinueWatchingVideos).toHaveBeenCalledWith('user-1');
        });
    });

    describe('UpdateWatchStateUseCase', () => {
        it('rejects missing required params', async () => {
            const repo = buildWatchListRepo();

            await expect(
                new UpdateWatchStateUseCase(repo).execute({
                    videoId: 'video-1',
                    timeWatched: 10,
                    watched: true,
                    userId: '',
                }),
            ).rejects.toMatchObject({ statusCode: 400 });
        });

        it('rejects when the target video does not exist', async () => {
            mockContainer.useCases.getVideoById.mockReturnValue({ execute: jest.fn().mockResolvedValue(null) });
            const repo = buildWatchListRepo();

            await expect(
                new UpdateWatchStateUseCase(repo).execute({
                    videoId: 'video-1',
                    timeWatched: 10,
                    watched: true,
                    userId: 'user-1',
                }),
            ).rejects.toMatchObject({ statusCode: 404 });
        });

        it('marks an episode as watched and persists video progress', async () => {
            const video = { id: 'video-1', episodeId: 'episode-1' };
            const episode = { id: 'episode-1', seasonId: 'season-1' };
            const persistedWatchList = buildWatchList();

            const getVideoByIdExecute = jest.fn().mockResolvedValue(video);
            const getEpisodeByIdExecute = jest.fn().mockResolvedValue(episode);
            const getSeasonByIdExecute = jest.fn().mockResolvedValue({ id: 'season-1', seriesId: 'series-1' });
            const setEpisodeWatchStateExecute = jest.fn().mockResolvedValue(undefined);

            mockContainer.useCases.getVideoById.mockReturnValue({ execute: getVideoByIdExecute });
            mockContainer.useCases.getEpisodeById.mockReturnValue({ execute: getEpisodeByIdExecute });
            mockContainer.useCases.getSeasonById.mockReturnValue({ execute: getSeasonByIdExecute });
            mockContainer.useCases.setEpisodeWatchState.mockReturnValue({ execute: setEpisodeWatchStateExecute });

            const repo = buildWatchListRepo({
                addVideo: jest.fn().mockResolvedValue(undefined),
                findByVideoIdAndUserId: jest.fn().mockResolvedValue(persistedWatchList),
                update: jest.fn().mockResolvedValue(persistedWatchList),
            });

            await new UpdateWatchStateUseCase(repo).execute({
                videoId: 'video-1',
                timeWatched: 340,
                watched: true,
                userId: 'user-1',
            });

            expect(setEpisodeWatchStateExecute).toHaveBeenCalledWith('episode-1', 'user-1', true);
            expect(repo.addVideo).toHaveBeenCalledWith('user-1', 'video-1');
            expect(repo.update).toHaveBeenCalledWith(
                persistedWatchList.id,
                expect.objectContaining({ watched: true, timeWatched: 340 }),
            );
        });

        it('adds a movie video to continue watching when playback is not finished', async () => {
            const video = { id: 'video-1', movieId: 'movie-1' };
            const movie = {
                id: 'movie-1',
                videos: [
                    { id: 'video-1', watchLists: [] },
                    { id: 'video-2', watchLists: [] },
                ],
            };
            const persistedWatchList = buildWatchList();
            const getMovieByIdExecute = jest.fn().mockResolvedValue(movie);
            const addContinueWatchingExecute = jest.fn().mockResolvedValue(undefined);

            mockContainer.useCases.getVideoById.mockReturnValue({ execute: jest.fn().mockResolvedValue(video) });
            mockContainer.useCases.getMoviebyId.mockReturnValue({ execute: getMovieByIdExecute });
            mockContainer.useCases.addVideoToContinueWatching.mockReturnValue({ execute: addContinueWatchingExecute });

            const repo = buildWatchListRepo({
                isMovieWatched: jest.fn().mockResolvedValue(false),
                addVideo: jest.fn().mockResolvedValue(undefined),
                findByVideoIdAndUserId: jest.fn().mockResolvedValue(persistedWatchList),
                update: jest.fn().mockResolvedValue(persistedWatchList),
            });

            await new UpdateWatchStateUseCase(repo).execute({
                videoId: 'video-1',
                timeWatched: 55,
                watched: false,
                userId: 'user-1',
            });

            expect(addContinueWatchingExecute).toHaveBeenCalledWith('video-1', 'user-1', undefined, 'movie-1');
            expect(repo.addVideo).toHaveBeenCalledWith('user-1', 'video-1');
            expect(repo.update).toHaveBeenCalledWith(
                persistedWatchList.id,
                expect.objectContaining({ watched: false, timeWatched: 55 }),
            );
        });
    });
});