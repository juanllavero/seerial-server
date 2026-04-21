import type { SeasonsRepositoryPort } from '@/api/v1/seasons/application/ports/SeasonsRepositoryPort';
import { CreateSeasonUseCase } from '@/api/v1/seasons/application/usecases/CreateSeasonUseCase';
import { DeleteSeasonUseCase } from '@/api/v1/seasons/application/usecases/DeleteSeasonsUseCase';
import { FindAllSeasonsUseCase } from '@/api/v1/seasons/application/usecases/FindAllSeasonsUseCase';
import { FindSeasonByIdUseCase } from '@/api/v1/seasons/application/usecases/FindSeasonByIdUseCase';
import { FindSeasonsBySeriesIdUseCase } from '@/api/v1/seasons/application/usecases/FindSeasonsBySeriesIdUseCase';
import { UpdateSeasonUseCase } from '@/api/v1/seasons/application/usecases/UpdateSeasonsUseCase';
import type { Season } from '@/api/v1/seasons/domain/Season';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {
    deleteEpisode: jest.fn(),
    deleteSeasonData: jest.fn(),
  },
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container') as {
  useCases: {
    deleteEpisode: jest.Mock;
    deleteSeasonData: jest.Mock;
  };
};

function buildSeason(overrides: Partial<Season> = {}): Season {
  return {
    id: 'season-1',
    seriesId: 'series-1',
    seasonNumber: 1,
    episodes: [{ id: 'episode-1' }, { id: 'episode-2' }] as never,
    ...overrides,
  } as unknown as Season;
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
  };
}

describe('Season use cases', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContainer.useCases.deleteEpisode.mockReturnValue({
      execute: jest.fn().mockResolvedValue(undefined),
    });
    mockContainer.useCases.deleteSeasonData.mockReturnValue({
      execute: jest.fn().mockResolvedValue(undefined),
    });
  });

  it('creates a season through the repository', async () => {
    const season = buildSeason();
    const repo = buildSeasonRepo({
      create: jest.fn().mockResolvedValue(season),
    });

    await expect(
      new CreateSeasonUseCase(repo).execute({ seasonNumber: 1 } as never),
    ).resolves.toEqual(season);
  });

  it('finds a season by id with include option', async () => {
    const season = buildSeason();
    const repo = buildSeasonRepo({
      findById: jest.fn().mockResolvedValue(season),
    });

    const result = await new FindSeasonByIdUseCase(repo).execute('season-1', 'all');

    expect(result).toEqual(season);
    expect(repo.findById).toHaveBeenCalledWith('season-1', 'all');
  });

  it('returns all seasons for a library/series scope', async () => {
    const seasons = [buildSeason(), buildSeason({ id: 'season-2', seasonNumber: 2 })];
    const repo = buildSeasonRepo({
      findAll: jest.fn().mockResolvedValue(seasons),
    });

    await expect(new FindAllSeasonsUseCase(repo).execute('series-1')).resolves.toEqual(seasons);
    expect(repo.findAll).toHaveBeenCalledWith('series-1');
  });

  it('returns seasons by series id', async () => {
    const seasons = [buildSeason()];
    const repo = buildSeasonRepo({
      findSeasonsBySeriesId: jest.fn().mockResolvedValue(seasons),
    });

    await expect(new FindSeasonsBySeriesIdUseCase(repo).execute('series-1')).resolves.toEqual(
      seasons,
    );
  });

  it('updates a season through the repository', async () => {
    const season = buildSeason({ seasonNumber: 2 });
    const repo = buildSeasonRepo({
      update: jest.fn().mockResolvedValue(season),
    });

    await expect(
      new UpdateSeasonUseCase(repo).execute('season-1', {
        seasonNumber: 2,
      } as never),
    ).resolves.toEqual(season);
  });

  it('throws when deleting a missing season', async () => {
    const repo = buildSeasonRepo({
      findById: jest.fn().mockResolvedValue(null),
    });

    await expect(new DeleteSeasonUseCase(repo).execute('missing')).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('deletes child episodes, season data, and the season row', async () => {
    const deleteEpisodeExecute = jest.fn().mockResolvedValue(undefined);
    const deleteSeasonDataExecute = jest.fn().mockResolvedValue(undefined);
    mockContainer.useCases.deleteEpisode.mockReturnValue({
      execute: deleteEpisodeExecute,
    });
    mockContainer.useCases.deleteSeasonData.mockReturnValue({
      execute: deleteSeasonDataExecute,
    });

    const repo = buildSeasonRepo({
      findById: jest.fn().mockResolvedValue(buildSeason()),
      delete: jest.fn().mockResolvedValue(undefined),
    });

    await new DeleteSeasonUseCase(repo).execute('season-1');

    expect(deleteEpisodeExecute).toHaveBeenCalledTimes(2);
    expect(deleteSeasonDataExecute).toHaveBeenCalledWith('season-1');
    expect(repo.delete).toHaveBeenCalledWith('season-1');
  });
});
