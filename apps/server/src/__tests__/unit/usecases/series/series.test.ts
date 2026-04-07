import type { SeriesRepositoryPort } from '@/api/v1/series/application/ports/SeriesRepositoryPort';
import { CreateSeriesUseCase } from '@/api/v1/series/application/usecases/CreateSeriesUseCase';
import { DeleteSeriesUseCase } from '@/api/v1/series/application/usecases/DeleteSeriesUseCase';
import { FindSeriesByIdUseCase } from '@/api/v1/series/application/usecases/FindSeriesByIdUseCase';
import { UpdateSeriesUseCase } from '@/api/v1/series/application/usecases/UpdateSeriesUseCase';
import type { Series } from '@/api/v1/series/domain/Series';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {
        deleteSeason: jest.fn(),
        deleteSeriesData: jest.fn(),
        getLibrary: jest.fn(),
        removeAnalyzedFolder: jest.fn(),
    },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container') as {
    useCases: {
        deleteSeason: jest.Mock;
        deleteSeriesData: jest.Mock;
        getLibrary: jest.Mock;
        removeAnalyzedFolder: jest.Mock;
    };
};

function buildSeries(overrides: Partial<Series> = {}): Series {
    return {
        id: 'series-1',
        libraryId: 'library-1',
        folder: '/shows/series-1',
        seasons: [{ id: 'season-1' }, { id: 'season-2' }] as never,
        ...overrides,
    } as unknown as Series;
}

function buildSeriesRepo(overrides: Partial<SeriesRepositoryPort> = {}): SeriesRepositoryPort {
    return {
        findAll: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        ...overrides,
    };
}

describe('Series use cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockContainer.useCases.deleteSeason.mockReturnValue({ execute: jest.fn().mockResolvedValue(undefined) });
        mockContainer.useCases.deleteSeriesData.mockReturnValue({ execute: jest.fn().mockResolvedValue(undefined) });
        mockContainer.useCases.getLibrary.mockReturnValue({ execute: jest.fn().mockResolvedValue({ id: 'library-1' }) });
        mockContainer.useCases.removeAnalyzedFolder.mockReturnValue({ execute: jest.fn().mockResolvedValue(undefined) });
    });

    it('creates a series through the repository', async () => {
        const series = buildSeries();
        const repo = buildSeriesRepo({ create: jest.fn().mockResolvedValue(series) });

        await expect(new CreateSeriesUseCase(repo).execute({ name: 'Lost' } as never)).resolves.toEqual(series);
    });

    it('finds a series by id with include option', async () => {
        const series = buildSeries();
        const repo = buildSeriesRepo({ findById: jest.fn().mockResolvedValue(series) });

        const result = await new FindSeriesByIdUseCase(repo).execute('series-1', 'few');

        expect(result).toEqual(series);
        expect(repo.findById).toHaveBeenCalledWith('series-1', 'few');
    });

    it('updates a series through the repository', async () => {
        const series = buildSeries({ name: 'Updated Lost' } as never);
        const repo = buildSeriesRepo({ update: jest.fn().mockResolvedValue(series) });

        await expect(new UpdateSeriesUseCase(repo).execute('series-1', { name: 'Updated Lost' } as never)).resolves.toEqual(series);
    });

    it('throws when deleting a missing series', async () => {
        const repo = buildSeriesRepo({ findById: jest.fn().mockResolvedValue(null) });

        await expect(new DeleteSeriesUseCase(repo).execute('missing')).rejects.toMatchObject({ statusCode: 404 });
    });

    it('deletes seasons, series data, analyzed folder, and the series row when library exists', async () => {
        const deleteSeasonExecute = jest.fn().mockResolvedValue(undefined);
        const deleteSeriesDataExecute = jest.fn().mockResolvedValue(undefined);
        const getLibraryExecute = jest.fn().mockResolvedValue({ id: 'library-1' });
        const removeAnalyzedFolderExecute = jest.fn().mockResolvedValue(undefined);

        mockContainer.useCases.deleteSeason.mockReturnValue({ execute: deleteSeasonExecute });
        mockContainer.useCases.deleteSeriesData.mockReturnValue({ execute: deleteSeriesDataExecute });
        mockContainer.useCases.getLibrary.mockReturnValue({ execute: getLibraryExecute });
        mockContainer.useCases.removeAnalyzedFolder.mockReturnValue({ execute: removeAnalyzedFolderExecute });

        const repo = buildSeriesRepo({
            findById: jest.fn().mockResolvedValue(buildSeries()),
            delete: jest.fn().mockResolvedValue(undefined),
        });

        await new DeleteSeriesUseCase(repo).execute('series-1');

        expect(deleteSeasonExecute).toHaveBeenCalledTimes(2);
        expect(deleteSeriesDataExecute).toHaveBeenCalledWith('series-1');
        expect(removeAnalyzedFolderExecute).toHaveBeenCalledWith('library-1', '/shows/series-1');
        expect(repo.delete).toHaveBeenCalledWith('series-1');
    });

    it('returns early without deleting the series row when the library is missing', async () => {
        const getLibraryExecute = jest.fn().mockResolvedValue(null);
        mockContainer.useCases.getLibrary.mockReturnValue({ execute: getLibraryExecute });

        const repo = buildSeriesRepo({
            findById: jest.fn().mockResolvedValue(buildSeries()),
            delete: jest.fn().mockResolvedValue(undefined),
        });

        await new DeleteSeriesUseCase(repo).execute('series-1');

        expect(repo.delete).not.toHaveBeenCalled();
    });
});