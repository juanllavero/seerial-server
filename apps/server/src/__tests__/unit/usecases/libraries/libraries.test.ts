import type { Library } from '@seerial/domain';
import type { AlbumsRepositoryPort } from '@/api/v1/albums/application/ports/AlbumsRepositoryPort';
import type { LibrariesRepositoryPort } from '@/api/v1/libraries/application/ports/LibrariesRepositoryPort';
import { DeleteLibraryUseCase } from '@/api/v1/libraries/application/usecases/DeleteLibraryUseCase';
import { GetLibrariesUseCase } from '@/api/v1/libraries/application/usecases/GetLibrariesUseCase';
import { GetLibraryByVideoIdUseCase } from '@/api/v1/libraries/application/usecases/GetLibraryByVideoIdUseCase';
import { GetLibraryUseCase } from '@/api/v1/libraries/application/usecases/GetLibraryUseCase';
import { AddAnalyzedFileUseCase } from '@/api/v1/libraries/application/usecases/files/AddAnalyzedFileUseCase';
import { RemoveAnalyzedFileUseCase } from '@/api/v1/libraries/application/usecases/files/RemoveAnalyzedFileUseCase';
import { AddAnalyzedFolderUseCase } from '@/api/v1/libraries/application/usecases/folders/AddAnalyzedFolderUseCase';
import { RemoveAnalyzedFolderUseCase } from '@/api/v1/libraries/application/usecases/folders/RemoveAnalyzedFolderUseCase';
import { ReorderLibrariesUseCase } from '@/api/v1/libraries/application/usecases/ReorderLibrariesUseCase';
import { ReorderLibraryItemsUseCase } from '@/api/v1/libraries/application/usecases/ReorderLibraryItemsUseCase';
import { UpdateLibraryUseCase } from '@/api/v1/libraries/application/usecases/UpdateLibraryUseCase';
import type { MoviesRepositoryPort } from '@/api/v1/movies/application/ports/MoviesRepositoryPort';
import type { SeriesRepositoryPort } from '@/api/v1/series/application/ports/SeriesRepositoryPort';

function buildLibrary(overrides: Partial<Library> = {}): Library {
    return {
        id: 'lib-1',
        name: 'Movies',
        language: 'en',
        type: 'movie',
        order: 0,
        hidden: false,
        folders: [],
        movies: [],
        series: [],
        albums: [],
        ...overrides,
    } as unknown as Library;
}

function buildLibrariesRepo(overrides: Partial<LibrariesRepositoryPort> = {}): LibrariesRepositoryPort {
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

function buildSeriesRepo(overrides: Partial<SeriesRepositoryPort> = {}): SeriesRepositoryPort {
    return {
        findAll: jest.fn().mockResolvedValue([]),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    } as unknown as SeriesRepositoryPort;
}

function buildMoviesRepo(overrides: Partial<MoviesRepositoryPort> = {}): MoviesRepositoryPort {
    return {
        findAll: jest.fn().mockResolvedValue([]),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    } as unknown as MoviesRepositoryPort;
}

function buildAlbumsRepo(overrides: Partial<AlbumsRepositoryPort> = {}): AlbumsRepositoryPort {
    return {
        findAll: jest.fn().mockResolvedValue([]),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn().mockResolvedValue(undefined),
        ...overrides,
    } as unknown as AlbumsRepositoryPort;
}

describe('Libraries use cases', () => {
    describe('GetLibrariesUseCase', () => {
        it('returns all libraries', async () => {
            const libs = [buildLibrary(), buildLibrary({ id: 'lib-2', name: 'TV Shows' })];
            const repo = buildLibrariesRepo({ getAll: jest.fn().mockResolvedValue(libs) });

            const result = await new GetLibrariesUseCase(repo).execute();

            expect(result).toEqual(libs);
            expect(repo.getAll).toHaveBeenCalledTimes(1);
        });

        it('returns an empty array when no libraries exist', async () => {
            const repo = buildLibrariesRepo({ getAll: jest.fn().mockResolvedValue([]) });
            const result = await new GetLibrariesUseCase(repo).execute();
            expect(result).toEqual([]);
        });
    });

    describe('GetLibraryUseCase', () => {
        it('returns library by id', async () => {
            const lib = buildLibrary();
            const repo = buildLibrariesRepo({ getById: jest.fn().mockResolvedValue(lib) });

            const result = await new GetLibraryUseCase(repo).execute('lib-1');

            expect(result).toEqual(lib);
            expect(repo.getById).toHaveBeenCalledWith('lib-1');
        });

        it('returns null when library does not exist', async () => {
            const repo = buildLibrariesRepo({ getById: jest.fn().mockResolvedValue(null) });
            const result = await new GetLibraryUseCase(repo).execute('nonexistent');
            expect(result).toBeNull();
        });

        it('returns library by video id', async () => {
            const lib = buildLibrary();
            const repo = buildLibrariesRepo({ getByVideoId: jest.fn().mockResolvedValue(lib) });

            const result = await new GetLibraryByVideoIdUseCase(repo).execute('video-1');

            expect(result).toEqual(lib);
            expect(repo.getByVideoId).toHaveBeenCalledWith('video-1');
        });
    });

    describe('UpdateLibraryUseCase', () => {
        it('delegates to the repository and returns the updated library', async () => {
            const updated = buildLibrary({ name: 'Renamed' });
            const repo = buildLibrariesRepo({ update: jest.fn().mockResolvedValue(updated) });

            const result = await new UpdateLibraryUseCase(repo).execute('lib-1', { name: 'Renamed' });

            expect(result).toEqual(updated);
            expect(repo.update).toHaveBeenCalledWith('lib-1', { name: 'Renamed' });
        });
    });

    describe('ReorderLibrariesUseCase', () => {
        it('calls reorder with ordered ids abd returns the result', async () => {
            const repo = buildLibrariesRepo({ reorder: jest.fn().mockResolvedValue(true) });

            const result = await new ReorderLibrariesUseCase(repo).execute(['lib-2', 'lib-1']);

            expect(result).toBe(true);
            expect(repo.reorder).toHaveBeenCalledWith(['lib-2', 'lib-1']);
        });
    });

    describe('ReorderLibraryItemsUseCase', () => {
        it('delegates item reordering to repository', async () => {
            const orderedItems = [
                { id: 'movie-1', type: 'movie' },
                { id: 'series-1', type: 'series' },
            ];
            const repo = buildLibrariesRepo({ reorderItems: jest.fn().mockResolvedValue(true) });

            const result = await new ReorderLibraryItemsUseCase(repo).execute('lib-1', orderedItems);

            expect(result).toBe(true);
            expect(repo.reorderItems).toHaveBeenCalledWith('lib-1', orderedItems);
        });
    });

    describe('Analyzed files and folders use cases', () => {
        it('adds and removes analyzed files through the repository', async () => {
            const library = buildLibrary();
            const repo = buildLibrariesRepo({
                addAnalyzedFile: jest.fn().mockResolvedValue(library),
                removeAnalyzedFile: jest.fn().mockResolvedValue(library),
            });

            await expect(new AddAnalyzedFileUseCase(repo).execute('lib-1', '/movies/a.mp4', 'video-1')).resolves.toEqual(library);
            await expect(new RemoveAnalyzedFileUseCase(repo).execute('lib-1', '/movies/a.mp4')).resolves.toEqual(library);

            expect(repo.addAnalyzedFile).toHaveBeenCalledWith('lib-1', '/movies/a.mp4', 'video-1');
            expect(repo.removeAnalyzedFile).toHaveBeenCalledWith('lib-1', '/movies/a.mp4');
        });

        it('adds and removes analyzed folders through the repository', async () => {
            const library = buildLibrary();
            const repo = buildLibrariesRepo({
                addAnalyzedFolder: jest.fn().mockResolvedValue(library),
                removeAnalyzedFolder: jest.fn().mockResolvedValue(library),
            });

            await expect(new AddAnalyzedFolderUseCase(repo).execute('lib-1', '/series/show', 'video-1')).resolves.toEqual(library);
            await expect(new RemoveAnalyzedFolderUseCase(repo).execute('lib-1', '/series/show')).resolves.toEqual(library);

            expect(repo.addAnalyzedFolder).toHaveBeenCalledWith('lib-1', '/series/show', 'video-1');
            expect(repo.removeAnalyzedFolder).toHaveBeenCalledWith('lib-1', '/series/show');
        });
    });

    describe('DeleteLibraryUseCase', () => {
        it('throws NotFoundException when library does not exist', async () => {
            const librariesRepo = buildLibrariesRepo({ getById: jest.fn().mockResolvedValue(null) });

            const useCase = new DeleteLibraryUseCase(
                librariesRepo,
                buildSeriesRepo(),
                buildMoviesRepo(),
                buildAlbumsRepo(),
            );

            await expect(useCase.execute('nonexistent')).rejects.toMatchObject({ statusCode: 404 });
        });

        it('deletes the library and its associated media when library exists', async () => {
            const library = buildLibrary();
            const librariesRepo = buildLibrariesRepo({
                getById: jest.fn().mockResolvedValue(library),
                delete: jest.fn().mockResolvedValue(true),
            });
            const seriesRepo = buildSeriesRepo();
            const moviesRepo = buildMoviesRepo();
            const albumsRepo = buildAlbumsRepo();

            const useCase = new DeleteLibraryUseCase(librariesRepo, seriesRepo, moviesRepo, albumsRepo);
            await useCase.execute('lib-1');

            expect(librariesRepo.delete).toHaveBeenCalledWith('lib-1');
        });
    });
});
