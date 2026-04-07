import type { Request } from 'express';
import { MoviesController } from '@/api/v1/movies/infrastructure/web/controllers/MoviesController';
import { MediaService } from '@/api/v1/shared/infrastructure/services/MediaService';
import { messages } from '@/config/messages';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {
        refreshMovieMetadata: jest.fn(),
        updateMovieId: jest.fn(),
        updateMovie: jest.fn(),
        deleteMovie: jest.fn(),
        getMoviebyId: jest.fn(),
        addMovieToWatchList: jest.fn(),
        removeMovieFromWatchList: jest.fn(),
        addVideoToContinueWatching: jest.fn(),
        removeVideoFromContinueWatching: jest.fn(),
    },
    externalSearchService: {
        searchMovies: jest.fn(),
        getImdbScore: jest.fn(),
    },
}));

jest.mock('@/api/v1/shared/infrastructure/services/MediaService', () => ({
    MediaService: {
        countRemainingVideos: jest.fn(),
    },
}));

const container = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

const asRequest = (value: Partial<Request>) => value as Request;

const createUseCase = (result?: unknown) => ({ execute: jest.fn().mockResolvedValue(result) });

describe('MoviesController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('delegates refresh, identification change, update and delete operations', async () => {
        const refreshExecute = jest.fn().mockResolvedValue(undefined);
        const updateIdExecute = jest.fn().mockResolvedValue(undefined);
        const updateExecute = jest.fn().mockResolvedValue({ id: 'movie-1', name: 'New Name' });
        const deleteExecute = jest.fn().mockResolvedValue(undefined);

        container.useCases.refreshMovieMetadata.mockReturnValue({ execute: refreshExecute });
        container.useCases.updateMovieId.mockReturnValue({ execute: updateIdExecute });
        container.useCases.updateMovie.mockReturnValue({ execute: updateExecute });
        container.useCases.deleteMovie.mockReturnValue({ execute: deleteExecute });

        const controller = new MoviesController();

        await controller.refreshMovieMetadata('movie-1');
        await controller.changeIdentification('movie-1', { themdbId: 100 } as never);
        const updateResponse = await controller.update('movie-1', { name: 'New Name' } as never);
        const deleteResponse = await controller.delete('movie-1');

        expect(refreshExecute).toHaveBeenCalledWith('movie-1');
        expect(updateIdExecute).toHaveBeenCalledWith('movie-1', 100);
        expect(updateExecute).toHaveBeenCalledWith('movie-1', { name: 'New Name' });
        expect(updateResponse.data).toEqual({ id: 'movie-1', name: 'New Name' });
        expect(deleteExecute).toHaveBeenCalledWith('movie-1');
        expect(deleteResponse.message).toBe(messages.success.delete);
    });

    it('throws not found when movie does not exist in get and setWatchState', async () => {
        container.useCases.getMoviebyId.mockReturnValue(createUseCase(null));

        const controller = new MoviesController();

        await expect(controller.get('movie-404')).rejects.toMatchObject({ statusCode: 404 });
        await expect(
            controller.setWatchState(
                'movie-404',
                { watched: true } as never,
                asRequest({ user: { id: 'user-1' } } as never),
            ),
        ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('marks a movie as watched and removes all videos from continue watching', async () => {
        const movie = {
            id: 'movie-1',
            videos: [
                { id: 'video-1', watchLists: [{ id: 'user-1', timeWatched: 10 }] },
                { id: 'video-2', watchLists: [] },
            ],
        };

        const addMovieExecute = jest.fn().mockResolvedValue(undefined);
        const removeContinueExecute = jest.fn().mockResolvedValue(undefined);
        const updateExecute = jest.fn().mockResolvedValue(movie);

        container.useCases.getMoviebyId.mockReturnValue(createUseCase(movie));
        container.useCases.addMovieToWatchList.mockReturnValue({ execute: addMovieExecute });
        container.useCases.removeVideoFromContinueWatching.mockReturnValue({ execute: removeContinueExecute });
        container.useCases.updateMovie.mockReturnValue({ execute: updateExecute });

        const response = await new MoviesController().setWatchState(
            'movie-1',
            { watched: true } as never,
            asRequest({ user: { id: 'user-1' } } as never),
        );

        expect(addMovieExecute).toHaveBeenCalledWith('movie-1', 'user-1');
        expect(removeContinueExecute).toHaveBeenCalledTimes(2);
        expect(removeContinueExecute).toHaveBeenCalledWith('video-1', 'user-1');
        expect(removeContinueExecute).toHaveBeenCalledWith('video-2', 'user-1');
        expect(updateExecute).toHaveBeenCalledWith('movie-1', movie);
        expect(response.success).toBe(true);
    });

    it('marks a movie as not watched and re-adds partially watched videos to continue watching', async () => {
        const movie = {
            id: 'movie-1',
            videos: [
                { id: 'video-1', watchLists: [{ id: 'user-1', timeWatched: 0 }] },
                { id: 'video-2', watchLists: [{ id: 'user-1', timeWatched: 25 }] },
                { id: 'video-3', watchLists: [{ id: 'other-user', timeWatched: 100 }] },
            ],
        };

        const removeMovieExecute = jest.fn().mockResolvedValue(undefined);
        const addContinueExecute = jest.fn().mockResolvedValue(undefined);

        container.useCases.getMoviebyId.mockReturnValue(createUseCase(movie));
        container.useCases.removeMovieFromWatchList.mockReturnValue({ execute: removeMovieExecute });
        container.useCases.addVideoToContinueWatching.mockReturnValue({ execute: addContinueExecute });
        container.useCases.updateMovie.mockReturnValue(createUseCase(movie));

        const response = await new MoviesController().setWatchState(
            'movie-1',
            { watched: false } as never,
            asRequest({ user: { id: 'user-1' } } as never),
        );

        expect(removeMovieExecute).toHaveBeenCalledWith('movie-1', 'user-1');
        expect(addContinueExecute).toHaveBeenCalledTimes(1);
        expect(addContinueExecute).toHaveBeenCalledWith('video-2', 'user-1');
        expect(response.message).toBe(messages.success.update);
    });

    it('returns movie data, search results, imdb score and remaining videos', async () => {
        const movie = { id: 'movie-1', name: 'Interstellar', videos: [] };
        container.useCases.getMoviebyId.mockReturnValue(createUseCase(movie));
        container.externalSearchService.searchMovies.mockResolvedValue([{ id: 1 }]);
        container.externalSearchService.getImdbScore.mockResolvedValue(8.7);
        (MediaService.countRemainingVideos as jest.Mock).mockResolvedValue(3);

        const controller = new MoviesController();

        const getResponse = await controller.get('movie-1');
        const searchResponse = await controller.searchMovies('Interstellar', '2014');
        const imdbResponse = await controller.getImdbScore('tt0816692');
        const remainingResponse = await controller.getRemainingVideos(
            'movie-1',
            asRequest({ user: { id: 'user-1' } } as never),
        );

        expect(getResponse.data).toEqual(movie);
        expect(searchResponse.data).toEqual([{ id: 1 }]);
        expect(imdbResponse.data).toBe(8.7);
        expect(MediaService.countRemainingVideos).toHaveBeenCalledWith('movie-1', 'user-1');
        expect(remainingResponse.data).toBe(3);
    });
});
