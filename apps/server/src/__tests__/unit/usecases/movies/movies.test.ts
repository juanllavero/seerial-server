import type { LibrariesRepositoryPort } from '@/api/v1/libraries/application/ports/LibrariesRepositoryPort';
import type { MoviesRepositoryPort } from '@/api/v1/movies/application/ports/MoviesRepositoryPort';
import { DeleteMovieUseCase } from '@/api/v1/movies/application/usecases/DeleteMovieUseCase';
import { FindMovieByIdUseCase } from '@/api/v1/movies/application/usecases/FindMovieByIdUseCase';
import { FindMovieByPathUseCase } from '@/api/v1/movies/application/usecases/FindMovieByPathUseCase';
import { SearchMovieMetadataUseCase } from '@/api/v1/movies/application/usecases/SearchMovieMetadataUseCase';
import { UpdateMovieIdUseCase } from '@/api/v1/movies/application/usecases/UpdateMovieIdUseCase';
import { UpdateMovieUseCase } from '@/api/v1/movies/application/usecases/UpdateMoviesUseCase';
import type { Movie } from '@/api/v1/movies/domain/Movie';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    deleteVideo: jest.fn(),
    deleteMovieData: jest.fn(),
  },
}));

jest.mock('@/api/v1/shared/infrastructure/services/FileSearchService', () => ({
  changeIdentificationMovie: jest.fn(),
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container') as {
  useCases: {
    deleteVideo: jest.Mock;
    deleteMovieData: jest.Mock;
  };
};

const mockChangeIdentificationMovie = jest.requireMock(
  '@/api/v1/shared/infrastructure/services/FileSearchService',
).changeIdentificationMovie as jest.Mock;

function buildMovie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 'movie-1',
    libraryId: 'library-1',
    folder: '/media/movies/movie-1',
    videos: [{ id: 'video-1' }, { id: 'video-2' }] as never,
    ...overrides,
  } as unknown as Movie;
}

function buildMoviesRepo(overrides: Partial<MoviesRepositoryPort> = {}): MoviesRepositoryPort {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByPath: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  };
}

function buildLibrariesRepo(
  overrides: Partial<LibrariesRepositoryPort> = {},
): LibrariesRepositoryPort {
  return {
    getAll: jest.fn(),
    getContent: jest.fn(),
    getById: jest.fn(),
    getByAlbumId: jest.fn(),
    getByMovieId: jest.fn(),
    getBySeriesId: jest.fn(),
    getBySeasonId: jest.fn(),
    getByVideoId: jest.fn(),
    reorder: jest.fn(),
    reorderItems: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addAnalyzedFolder: jest.fn(),
    addAnalyzedFile: jest.fn(),
    removeAnalyzedFile: jest.fn(),
    removeAnalyzedFolder: jest.fn(),
    ...overrides,
  };
}

describe('Movie use cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContainer.useCases.deleteVideo.mockReturnValue({
      execute: jest.fn().mockResolvedValue(undefined),
    });
    mockContainer.useCases.deleteMovieData.mockReturnValue({
      execute: jest.fn().mockResolvedValue(undefined),
    });
  });

  describe('FindMovieByIdUseCase', () => {
    it('returns the movie from the repository', async () => {
      const movie = buildMovie();
      const repo = buildMoviesRepo({
        findById: jest.fn().mockResolvedValue(movie),
      });

      const result = await new FindMovieByIdUseCase(repo).execute(movie.id);

      expect(result).toEqual(movie);
      expect(repo.findById).toHaveBeenCalledWith(movie.id);
    });

    it('returns null when the movie does not exist', async () => {
      const repo = buildMoviesRepo({
        findById: jest.fn().mockResolvedValue(null),
      });

      await expect(new FindMovieByIdUseCase(repo).execute('missing')).resolves.toBeNull();
    });
  });

  describe('FindMovieByPathUseCase', () => {
    it('delegates movie lookup by path', async () => {
      const movie = buildMovie();
      const repo = buildMoviesRepo({
        findByPath: jest.fn().mockResolvedValue(movie),
      });

      const result = await new FindMovieByPathUseCase(repo).execute(
        '/media/movies/movie-1/file.mkv',
      );

      expect(result).toEqual(movie);
      expect(repo.findByPath).toHaveBeenCalledWith('/media/movies/movie-1/file.mkv');
    });
  });

  describe('UpdateMovieUseCase', () => {
    it('updates the movie through the repository', async () => {
      const movie = buildMovie({ name: 'Updated Movie' } as never);
      const repo = buildMoviesRepo({
        update: jest.fn().mockResolvedValue(movie),
      });

      const result = await new UpdateMovieUseCase(repo).execute('movie-1', {
        name: 'Updated Movie',
      } as never);

      expect(result).toEqual(movie);
      expect(repo.update).toHaveBeenCalledWith('movie-1', {
        name: 'Updated Movie',
      });
    });
  });

  describe('DeleteMovieUseCase', () => {
    it('throws when the movie does not exist', async () => {
      const moviesRepo = buildMoviesRepo({
        findById: jest.fn().mockResolvedValue(null),
      });

      await expect(
        new DeleteMovieUseCase(buildLibrariesRepo(), moviesRepo).execute('missing'),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('deletes child videos, movie data, analyzed folder, and the movie row', async () => {
      const movie = buildMovie();
      const deleteVideoExecute = jest.fn().mockResolvedValue(undefined);
      const deleteMovieDataExecute = jest.fn().mockResolvedValue(undefined);

      mockContainer.useCases.deleteVideo.mockReturnValue({
        execute: deleteVideoExecute,
      });
      mockContainer.useCases.deleteMovieData.mockReturnValue({
        execute: deleteMovieDataExecute,
      });

      const moviesRepo = buildMoviesRepo({
        findById: jest.fn().mockResolvedValue(movie),
        delete: jest.fn().mockResolvedValue(undefined),
      });
      const librariesRepo = buildLibrariesRepo({
        getById: jest.fn().mockResolvedValue({ id: movie.libraryId }),
        removeAnalyzedFolder: jest.fn().mockResolvedValue(undefined),
      });

      await new DeleteMovieUseCase(librariesRepo, moviesRepo).execute(movie.id);

      expect(deleteVideoExecute).toHaveBeenCalledTimes(2);
      expect(deleteVideoExecute).toHaveBeenNthCalledWith(1, 'video-1');
      expect(deleteVideoExecute).toHaveBeenNthCalledWith(2, 'video-2');
      expect(deleteMovieDataExecute).toHaveBeenCalledWith(movie.id);
      expect(librariesRepo.removeAnalyzedFolder).toHaveBeenCalledWith(
        movie.libraryId,
        movie.folder,
      );
      expect(moviesRepo.delete).toHaveBeenCalledWith(movie.id);
    });

    it('skips analyzed-folder cleanup when the library cannot be found', async () => {
      const movie = buildMovie({ videos: [] as never });
      const deleteMovieDataExecute = jest.fn().mockResolvedValue(undefined);

      mockContainer.useCases.deleteMovieData.mockReturnValue({
        execute: deleteMovieDataExecute,
      });

      const moviesRepo = buildMoviesRepo({
        findById: jest.fn().mockResolvedValue(movie),
        delete: jest.fn().mockResolvedValue(undefined),
      });
      const librariesRepo = buildLibrariesRepo({
        getById: jest.fn().mockResolvedValue(null),
        removeAnalyzedFolder: jest.fn(),
      });

      await new DeleteMovieUseCase(librariesRepo, moviesRepo).execute(movie.id);

      expect(deleteMovieDataExecute).toHaveBeenCalledWith(movie.id);
      expect(librariesRepo.removeAnalyzedFolder).not.toHaveBeenCalled();
      expect(moviesRepo.delete).toHaveBeenCalledWith(movie.id);
    });
  });

  describe('UpdateMovieIdUseCase', () => {
    it('delegates movie id reassignment to the file search service', async () => {
      await new UpdateMovieIdUseCase().execute('movie-1', 155);

      expect(mockChangeIdentificationMovie).toHaveBeenCalledWith('movie-1', 155);
    });
  });

  describe('SearchMovieMetadataUseCase', () => {
    it('currently resolves without a result', async () => {
      await expect(new SearchMovieMetadataUseCase().execute()).resolves.toBeUndefined();
    });
  });
});
