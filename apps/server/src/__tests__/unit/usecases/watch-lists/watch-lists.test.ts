import type { ContinueWatchingVideoDTO } from '@seerial/domain';
import type { WatchListRepositoryPort } from '@/api/v1/watch-lists/application/ports/WatchListRepositoryPort';
import { AddContinueWatchingVideoUseCase } from '@/api/v1/watch-lists/application/usecases/AddContinueWatchingVideoUseCase';
import { AddMovieToWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/AddMovieToWatchListUseCase';
import { AddSeasonToWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/AddSeasonToWatchListUseCase';
import { AddSeriesToWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/AddSeriesToWatchListUseCase';
import { AddVideoToWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/AddVideoToWatchListUseCase';
import { ClearContinueWatchingUseCase } from '@/api/v1/watch-lists/application/usecases/ClearContinueWatchingUseCase';
import { DeleteWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/DeleteWatchListUseCase';
import { GetContinueWatchingVideosUseCase } from '@/api/v1/watch-lists/application/usecases/GetContinueWatchingVideosUseCase';
import { GetCurrentEpisodeUseCase } from '@/api/v1/watch-lists/application/usecases/GetCurrentEpisodeUseCase';
import { GetCurrentSeasonUseCase } from '@/api/v1/watch-lists/application/usecases/GetCurrentlSeasonUseCase';
import { GetCurrentVideoUseCase } from '@/api/v1/watch-lists/application/usecases/GetCurrentVideoUseCase';
import { RemoveContinueWatchingVideoUseCase } from '@/api/v1/watch-lists/application/usecases/RemoveContinueWatchingVideoUseCase';
import { RemoveMovieFromWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/RemoveMovieFromWatchListUseCase';
import { RemoveSeasonFromWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/RemoveSeasonFromWatchListUseCase';
import { RemoveSeriesFromWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/RemoveSeriesFromWatchListUseCase';
import { RemoveVideoFromWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/RemoveVideoFromWatchListUseCase';
import { UpdateWatchListUseCase } from '@/api/v1/watch-lists/application/usecases/UpdateWatchListUseCase';
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

function buildWatchListRepo(
  overrides: Partial<WatchListRepositoryPort> = {},
): WatchListRepositoryPort {
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
      const repo = buildWatchListRepo({
        addContinueWatchingVideo: jest.fn().mockResolvedValue(watchList),
      });

      const result = await new AddContinueWatchingVideoUseCase(repo).execute(
        'video-1',
        'user-1',
        'series-1',
      );

      expect(result).toEqual(watchList);
      expect(repo.addContinueWatchingVideo).toHaveBeenCalledWith(
        'video-1',
        'user-1',
        'series-1',
        undefined,
      );
    });
  });

  describe('RemoveContinueWatchingVideoUseCase', () => {
    it('removes a continue-watching entry through the repository', async () => {
      const repo = buildWatchListRepo({
        removeContinueWatchingVideo: jest.fn().mockResolvedValue(undefined),
      });

      await new RemoveContinueWatchingVideoUseCase(repo).execute('video-1', 'user-1');

      expect(repo.removeContinueWatchingVideo).toHaveBeenCalledWith('video-1', 'user-1');
    });
  });

  describe('ClearContinueWatchingUseCase', () => {
    it('clears continue-watching entries through the repository', async () => {
      const repo = buildWatchListRepo({ clearContinueWatching: jest.fn().mockResolvedValue(true) });

      await expect(
        new ClearContinueWatchingUseCase(repo).execute('user-1', 'series-1'),
      ).resolves.toBe(true);
      expect(repo.clearContinueWatching).toHaveBeenCalledWith('user-1', 'series-1', undefined);
    });
  });

  describe('GetContinueWatchingVideosUseCase', () => {
    it('returns continue-watching videos for a user', async () => {
      const videos = [{ videoId: 'video-1' }] as ContinueWatchingVideoDTO[];
      const repo = buildWatchListRepo({
        getContinueWatchingVideos: jest.fn().mockResolvedValue(videos),
      });

      const result = await new GetContinueWatchingVideosUseCase(repo).execute('user-1');

      expect(result).toEqual(videos);
      expect(repo.getContinueWatchingVideos).toHaveBeenCalledWith('user-1');
    });
  });

  describe('watch-list relation management use cases', () => {
    it('adds and removes movie/series/season/video items through the repository', async () => {
      const repo = buildWatchListRepo({
        addMovie: jest.fn().mockResolvedValue(undefined),
        addSeries: jest.fn().mockResolvedValue(undefined),
        addSeason: jest.fn().mockResolvedValue(undefined),
        addVideo: jest.fn().mockResolvedValue(undefined),
        removeMovie: jest.fn().mockResolvedValue(undefined),
        removeSeries: jest.fn().mockResolvedValue(undefined),
        removeSeason: jest.fn().mockResolvedValue(undefined),
        removeVideo: jest.fn().mockResolvedValue(undefined),
      });

      await new AddMovieToWatchListUseCase(repo).execute('user-1', 'movie-1');
      await new AddSeriesToWatchListUseCase(repo).execute('user-1', 'series-1');
      await new AddSeasonToWatchListUseCase(repo).execute('user-1', 'season-1');
      await new AddVideoToWatchListUseCase(repo).execute('user-1', 'video-1');

      await new RemoveMovieFromWatchListUseCase(repo).execute('user-1', 'movie-1');
      await new RemoveSeriesFromWatchListUseCase(repo).execute('user-1', 'series-1');
      await new RemoveSeasonFromWatchListUseCase(repo).execute('user-1', 'season-1');
      await new RemoveVideoFromWatchListUseCase(repo).execute('user-1', 'video-1');

      expect(repo.addMovie).toHaveBeenCalledWith('user-1', 'movie-1');
      expect(repo.addSeries).toHaveBeenCalledWith('user-1', 'series-1');
      expect(repo.addSeason).toHaveBeenCalledWith('user-1', 'season-1');
      expect(repo.addVideo).toHaveBeenCalledWith('user-1', 'video-1');
      expect(repo.removeMovie).toHaveBeenCalledWith('user-1', 'movie-1');
      expect(repo.removeSeries).toHaveBeenCalledWith('user-1', 'series-1');
      expect(repo.removeSeason).toHaveBeenCalledWith('user-1', 'season-1');
      expect(repo.removeVideo).toHaveBeenCalledWith('user-1', 'video-1');
    });

    it('reads current episode, season and video from repository', async () => {
      const episode = { id: 'episode-1' };
      const season = { id: 'season-1' };
      const video = { id: 'video-1' };

      const repo = buildWatchListRepo({
        findCurrentEpisode: jest.fn().mockResolvedValue(episode),
        findCurrentSeason: jest.fn().mockResolvedValue(season),
        findCurrentVideo: jest.fn().mockResolvedValue(video),
      });

      await expect(
        new GetCurrentEpisodeUseCase(repo).execute('season-1', 'user-1'),
      ).resolves.toEqual(episode);
      await expect(
        new GetCurrentSeasonUseCase(repo).execute('series-1', 'user-1'),
      ).resolves.toEqual(season);
      await expect(new GetCurrentVideoUseCase(repo).execute('movie-1', 'user-1')).resolves.toEqual(
        video,
      );

      expect(repo.findCurrentEpisode).toHaveBeenCalledWith('season-1', 'user-1');
      expect(repo.findCurrentSeason).toHaveBeenCalledWith('series-1', 'user-1');
      expect(repo.findCurrentVideo).toHaveBeenCalledWith('movie-1', 'user-1');
    });

    it('updates and deletes watch-list rows through the repository', async () => {
      const watchList = buildWatchList({ watched: true, timeWatched: 123 });
      const repo = buildWatchListRepo({
        update: jest.fn().mockResolvedValue(watchList),
        delete: jest.fn().mockResolvedValue(undefined),
      });

      await expect(
        new UpdateWatchListUseCase(repo).execute('watch-list-1', {
          watched: true,
          timeWatched: 123,
        }),
      ).resolves.toEqual(watchList);
      await expect(
        new DeleteWatchListUseCase(repo).execute('watch-list-1'),
      ).resolves.toBeUndefined();

      expect(repo.update).toHaveBeenCalledWith('watch-list-1', { watched: true, timeWatched: 123 });
      expect(repo.delete).toHaveBeenCalledWith('watch-list-1');
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
      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(null),
      });
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
      const getSeasonByIdExecute = jest
        .fn()
        .mockResolvedValue({ id: 'season-1', seriesId: 'series-1' });
      const setEpisodeWatchStateExecute = jest.fn().mockResolvedValue(undefined);

      mockContainer.useCases.getVideoById.mockReturnValue({ execute: getVideoByIdExecute });
      mockContainer.useCases.getEpisodeById.mockReturnValue({ execute: getEpisodeByIdExecute });
      mockContainer.useCases.getSeasonById.mockReturnValue({ execute: getSeasonByIdExecute });
      mockContainer.useCases.setEpisodeWatchState.mockReturnValue({
        execute: setEpisodeWatchStateExecute,
      });

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

    it('rejects when the episode cannot be resolved', async () => {
      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue({ id: 'video-1', episodeId: 'episode-1' }),
      });
      mockContainer.useCases.getEpisodeById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(null),
      });

      await expect(
        new UpdateWatchStateUseCase(buildWatchListRepo()).execute({
          videoId: 'video-1',
          timeWatched: 30,
          watched: true,
          userId: 'user-1',
        }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('rejects when the season cannot be resolved', async () => {
      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue({ id: 'video-1', episodeId: 'episode-1' }),
      });
      mockContainer.useCases.getEpisodeById.mockReturnValue({
        execute: jest.fn().mockResolvedValue({ id: 'episode-1', seasonId: 'season-1' }),
      });
      mockContainer.useCases.getSeasonById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(null),
      });

      await expect(
        new UpdateWatchStateUseCase(buildWatchListRepo()).execute({
          videoId: 'video-1',
          timeWatched: 30,
          watched: true,
          userId: 'user-1',
        }),
      ).rejects.toMatchObject({ statusCode: 404 });
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

      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(video),
      });
      mockContainer.useCases.getMoviebyId.mockReturnValue({ execute: getMovieByIdExecute });
      mockContainer.useCases.addVideoToContinueWatching.mockReturnValue({
        execute: addContinueWatchingExecute,
      });

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

      expect(addContinueWatchingExecute).toHaveBeenCalledWith(
        'video-1',
        'user-1',
        undefined,
        'movie-1',
      );
      expect(repo.addVideo).toHaveBeenCalledWith('user-1', 'video-1');
      expect(repo.update).toHaveBeenCalledWith(
        persistedWatchList.id,
        expect.objectContaining({ watched: false, timeWatched: 55 }),
      );
    });

    it('marks a movie as watched when all videos are complete and clears continue watching', async () => {
      const video = { id: 'video-2', movieId: 'movie-1' };
      const movie = {
        id: 'movie-1',
        videos: [
          { id: 'video-1', watchLists: [{ userId: 'user-1' }] },
          { id: 'video-2', watchLists: [] },
        ],
      };
      const persistedWatchList = buildWatchList();
      const removeContinueWatchingExecute = jest.fn().mockResolvedValue(undefined);

      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(video),
      });
      mockContainer.useCases.getMoviebyId.mockReturnValue({
        execute: jest.fn().mockResolvedValue(movie),
      });
      mockContainer.useCases.removeVideoFromContinueWatching.mockReturnValue({
        execute: removeContinueWatchingExecute,
      });

      const repo = buildWatchListRepo({
        addMovie: jest.fn().mockResolvedValue(undefined),
        addVideo: jest.fn().mockResolvedValue(undefined),
        findByVideoIdAndUserId: jest.fn().mockResolvedValue(persistedWatchList),
        update: jest.fn().mockResolvedValue(persistedWatchList),
      });

      await new UpdateWatchStateUseCase(repo).execute({
        videoId: 'video-2',
        timeWatched: 999,
        watched: true,
        userId: 'user-1',
      });

      expect(repo.addMovie).toHaveBeenCalledWith('user-1', 'movie-1');
      expect(removeContinueWatchingExecute).toHaveBeenCalledWith('video-2', 'user-1');
    });

    it('removes the movie watch-list relation when progress falls below completion', async () => {
      const video = { id: 'video-1', movieId: 'movie-1' };

      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(video),
      });
      mockContainer.useCases.getMoviebyId.mockReturnValue({
        execute: jest.fn().mockResolvedValue({
          id: 'movie-1',
          videos: [
            { id: 'video-1', watchLists: [] },
            { id: 'video-2', watchLists: [{ userId: 'another-user' }] },
          ],
        }),
      });
      mockContainer.useCases.addVideoToContinueWatching.mockReturnValue({
        execute: jest.fn().mockResolvedValue(undefined),
      });

      const repo = buildWatchListRepo({
        isMovieWatched: jest.fn().mockResolvedValue(true),
        removeMovie: jest.fn().mockResolvedValue(undefined),
        addVideo: jest.fn().mockResolvedValue(undefined),
        findByVideoIdAndUserId: jest.fn().mockResolvedValue(buildWatchList()),
        update: jest.fn().mockResolvedValue(buildWatchList()),
      });

      await new UpdateWatchStateUseCase(repo).execute({
        videoId: 'video-1',
        timeWatched: 12,
        watched: false,
        userId: 'user-1',
      });

      expect(repo.removeMovie).toHaveBeenCalledWith('user-1', 'movie-1');
    });

    it('rejects when the movie cannot be resolved', async () => {
      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue({ id: 'video-1', movieId: 'movie-1' }),
      });
      mockContainer.useCases.getMoviebyId.mockReturnValue({
        execute: jest.fn().mockResolvedValue(null),
      });

      await expect(
        new UpdateWatchStateUseCase(buildWatchListRepo()).execute({
          videoId: 'video-1',
          timeWatched: 30,
          watched: true,
          userId: 'user-1',
        }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('returns after persisting progress when no watch-list row exists yet', async () => {
      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue({ id: 'video-1', movieId: 'movie-1' }),
      });
      mockContainer.useCases.getMoviebyId.mockReturnValue({
        execute: jest
          .fn()
          .mockResolvedValue({ id: 'movie-1', videos: [{ id: 'video-1', watchLists: [] }] }),
      });
      mockContainer.useCases.addVideoToContinueWatching.mockReturnValue({
        execute: jest.fn().mockResolvedValue(undefined),
      });

      const repo = buildWatchListRepo({
        isMovieWatched: jest.fn().mockResolvedValue(false),
        addVideo: jest.fn().mockResolvedValue(undefined),
        findByVideoIdAndUserId: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      });

      await expect(
        new UpdateWatchStateUseCase(repo).execute({
          videoId: 'video-1',
          timeWatched: 10,
          watched: false,
          userId: 'user-1',
        }),
      ).resolves.toBeUndefined();

      expect(repo.update).not.toHaveBeenCalled();
    });

    it('handles legacy delete-relationship error by forcing continue watching', async () => {
      const video = { id: 'video-1', episodeId: 'episode-1' };
      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(video),
      });
      mockContainer.useCases.getEpisodeById.mockReturnValue({
        execute: jest
          .fn()
          .mockResolvedValueOnce({ id: 'episode-1', seasonId: 'season-1' })
          .mockResolvedValueOnce({ id: 'episode-1', seasonId: 'season-1' }),
      });
      mockContainer.useCases.getSeasonById.mockReturnValue({
        execute: jest.fn().mockResolvedValue({ id: 'season-1', seriesId: 'series-1' }),
      });
      mockContainer.useCases.addVideoToContinueWatching.mockReturnValue({
        execute: jest.fn().mockResolvedValue(undefined),
      });
      mockContainer.useCases.setEpisodeWatchState.mockReturnValue({
        execute: jest
          .fn()
          .mockRejectedValue(new Error('Failed to delete WatchList relationship for episode')),
      });

      const repo = buildWatchListRepo({
        addVideo: jest.fn().mockResolvedValue(undefined),
        findByVideoIdAndUserId: jest.fn().mockResolvedValue(null),
      });

      await expect(
        new UpdateWatchStateUseCase(repo).execute({
          videoId: 'video-1',
          timeWatched: 1,
          watched: false,
          userId: 'user-1',
        }),
      ).resolves.toBeUndefined();

      expect(mockContainer.useCases.addVideoToContinueWatching).toHaveBeenCalled();
    });

    it('rethrows non-legacy errors when watched=true', async () => {
      const video = { id: 'video-1', episodeId: 'episode-1' };
      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(video),
      });
      mockContainer.useCases.getEpisodeById.mockReturnValue({
        execute: jest.fn().mockResolvedValue({ id: 'episode-1', seasonId: 'season-1' }),
      });
      mockContainer.useCases.getSeasonById.mockReturnValue({
        execute: jest.fn().mockResolvedValue({ id: 'season-1', seriesId: 'series-1' }),
      });
      mockContainer.useCases.setEpisodeWatchState.mockReturnValue({
        execute: jest.fn().mockRejectedValue(new Error('Different error')),
      });

      const repo = buildWatchListRepo({
        addVideo: jest.fn().mockResolvedValue(undefined),
        findByVideoIdAndUserId: jest.fn().mockResolvedValue(null),
      });

      await expect(
        new UpdateWatchStateUseCase(repo).execute({
          videoId: 'video-1',
          timeWatched: 1,
          watched: true,
          userId: 'user-1',
        }),
      ).rejects.toThrow('Different error');
    });

    it('rethrows non-Error values when delete-relationship detection cannot inspect them', async () => {
      const video = { id: 'video-1', movieId: 'movie-1' };
      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(video),
      });
      mockContainer.useCases.getMoviebyId.mockReturnValue({
        execute: jest
          .fn()
          .mockResolvedValue({ id: 'movie-1', videos: [{ id: 'video-1', watchLists: [] }] }),
      });

      const repo = buildWatchListRepo({
        isMovieWatched: jest.fn().mockResolvedValue(true),
        removeMovie: jest.fn().mockRejectedValue('plain failure'),
        addVideo: jest.fn().mockResolvedValue(undefined),
        findByVideoIdAndUserId: jest.fn().mockResolvedValue(null),
      });

      await expect(
        new UpdateWatchStateUseCase(repo).execute({
          videoId: 'video-1',
          timeWatched: 1,
          watched: false,
          userId: 'user-1',
        }),
      ).rejects.toBe('plain failure');
    });

    it('does not force continue watching when episode cannot be resolved in legacy flow', async () => {
      const video = { id: 'video-1', episodeId: 'episode-1' };
      const addContinueExec = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failed to delete WatchList relationship'))
        .mockResolvedValueOnce(undefined);
      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(video),
      });
      mockContainer.useCases.getEpisodeById.mockReturnValue({
        execute: jest
          .fn()
          .mockResolvedValueOnce({ id: 'episode-1', seasonId: 'season-1' })
          .mockResolvedValueOnce(null),
      });
      mockContainer.useCases.getSeasonById.mockReturnValue({
        execute: jest.fn().mockResolvedValue({ id: 'season-1', seriesId: 'series-1' }),
      });
      mockContainer.useCases.addVideoToContinueWatching.mockReturnValue({
        execute: addContinueExec,
      });

      const repo = buildWatchListRepo({
        addVideo: jest.fn().mockResolvedValue(undefined),
        findByVideoIdAndUserId: jest.fn().mockResolvedValue(null),
      });

      await expect(
        new UpdateWatchStateUseCase(repo).execute({
          videoId: 'video-1',
          timeWatched: 1,
          watched: false,
          userId: 'user-1',
        }),
      ).resolves.toBeUndefined();

      expect(addContinueExec).toHaveBeenCalledTimes(1);
    });

    it('does not force continue watching when season cannot be resolved in legacy flow', async () => {
      const video = { id: 'video-1', episodeId: 'episode-1' };
      const addContinueExec = jest
        .fn()
        .mockRejectedValueOnce(new Error('Failed to delete WatchList relationship'))
        .mockResolvedValueOnce(undefined);

      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(video),
      });
      mockContainer.useCases.getEpisodeById.mockReturnValue({
        execute: jest
          .fn()
          .mockResolvedValueOnce({ id: 'episode-1', seasonId: 'season-1' })
          .mockResolvedValueOnce({ id: 'episode-1', seasonId: 'season-1' }),
      });
      mockContainer.useCases.getSeasonById.mockReturnValue({
        execute: jest
          .fn()
          .mockResolvedValueOnce({ id: 'season-1', seriesId: 'series-1' })
          .mockResolvedValueOnce(null),
      });
      mockContainer.useCases.addVideoToContinueWatching.mockReturnValue({
        execute: addContinueExec,
      });

      await expect(
        new UpdateWatchStateUseCase(
          buildWatchListRepo({
            addVideo: jest.fn().mockResolvedValue(undefined),
            findByVideoIdAndUserId: jest.fn().mockResolvedValue(null),
          }),
        ).execute({
          videoId: 'video-1',
          timeWatched: 1,
          watched: false,
          userId: 'user-1',
        }),
      ).resolves.toBeUndefined();

      expect(addContinueExec).toHaveBeenCalledTimes(1);
    });

    it('forces continue watching for movie videos in legacy flow', async () => {
      const video = { id: 'video-1', movieId: 'movie-1' };
      mockContainer.useCases.getVideoById.mockReturnValue({
        execute: jest.fn().mockResolvedValue(video),
      });
      mockContainer.useCases.getMoviebyId.mockReturnValue({
        execute: jest
          .fn()
          .mockResolvedValue({ id: 'movie-1', videos: [{ id: 'video-1', watchLists: [] }] }),
      });
      mockContainer.useCases.addVideoToContinueWatching.mockReturnValue({
        execute: jest.fn().mockResolvedValue(undefined),
      });

      const repo = buildWatchListRepo({
        isMovieWatched: jest.fn().mockResolvedValue(false),
        addVideo: jest.fn().mockResolvedValue(undefined),
        findByVideoIdAndUserId: jest.fn().mockResolvedValue(null),
        addMovie: jest.fn().mockRejectedValue(new Error('Failed to delete WatchList relationship')),
      });

      await expect(
        new UpdateWatchStateUseCase(repo).execute({
          videoId: 'video-1',
          timeWatched: 1,
          watched: false,
          userId: 'user-1',
        }),
      ).resolves.toBeUndefined();

      expect(mockContainer.useCases.addVideoToContinueWatching().execute).toHaveBeenCalledWith(
        'video-1',
        'user-1',
        undefined,
        'movie-1',
      );
    });
  });
});
