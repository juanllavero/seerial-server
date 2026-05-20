/** biome-ignore-all lint/style/noNonNullAssertion: <Test file> */
import 'reflect-metadata';
import { EpisodeRepositoryImpl } from '@/api/v1/episodes/infrastructure/persistence/repositories/EpisodeRepositoryImpl';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { SeasonModel } from '@/api/v1/seasons/infrastructure/persistence/models/SeasonModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
import { LibraryTypes } from '@/data/interfaces/Media';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {},
  fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

let repo: EpisodeRepositoryImpl;

beforeAll(async () => {
  await getTestDataSource();
  repo = new EpisodeRepositoryImpl();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  const ds = await getTestDataSource();
  await clearAllTables(ds);
});

async function createSeason() {
  const library = await LibraryModel.save({
    id: `lib-${Math.random().toString(36).slice(2, 10)}`,
    name: 'Shows Library',
    type: LibraryTypes.SHOWS,
    language: 'en',
    folders: [],
    order: 0,
    hidden: false,
  });

  const series = await SeriesModel.save({
    id: `ser-${Math.random().toString(36).slice(2, 10)}`,
    libraryId: library.id,
    name: 'Test Series',
  });

  return SeasonModel.save({
    id: `sea-${Math.random().toString(36).slice(2, 10)}`,
    seriesId: series.id,
    name: 'Season 1',
    order: 1,
  });
}

describe('EpisodeRepositoryImpl', () => {
  describe('create / findById', () => {
    it('creates an episode with a generated id', async () => {
      const season = await createSeason();

      const episode = await repo.create({ seasonId: season.id, name: 'Pilot' });

      expect(episode).not.toBeNull();
      expect(episode!.id).toBeTruthy();
      expect(episode!.seasonId).toBe(season.id);
    });

    it('findById returns the episode for a valid id', async () => {
      const season = await createSeason();
      const created = await repo.create({
        seasonId: season.id,
        name: 'Episode 2',
      });

      const found = await repo.findById(created!.id);

      expect(found).not.toBeNull();
      expect(found!.name).toBe('Episode 2');
    });

    it('findById returns null for a non-existent id', async () => {
      const found = await repo.findById('nonexistent');
      expect(found).toBeNull();
    });

    it('returns the existing episode when created with the same id twice', async () => {
      const season = await createSeason();
      const first = await repo.create({ seasonId: season.id, name: 'Ep 1' });
      const second = await repo.create({
        id: first!.id,
        seasonId: season.id,
        name: 'Ep 1 Dup',
      });

      expect(second!.id).toBe(first!.id);
      expect(second!.name).toBe('Ep 1');
    });
  });

  describe('findAllBySeasonId', () => {
    it('returns an empty array when the season has no episodes', async () => {
      const season = await createSeason();
      const result = await repo.findAllBySeasonId(season.id);
      expect(result).toEqual([]);
    });

    it('returns all episodes for a given season', async () => {
      const season = await createSeason();
      await repo.create({ seasonId: season.id, name: 'Ep A' });
      await repo.create({ seasonId: season.id, name: 'Ep B' });

      const result = await repo.findAllBySeasonId(season.id);
      expect(result).toHaveLength(2);
    });
  });

  describe('update', () => {
    it('updates the episode name', async () => {
      const season = await createSeason();
      const episode = await repo.create({
        seasonId: season.id,
        name: 'Old Name',
      });

      const updated = await repo.update(episode!.id, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
    });

    it('throws for an empty id', async () => {
      await expect(repo.update('', { name: 'x' })).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('delete', () => {
    it('deletes the episode so it can no longer be found', async () => {
      const season = await createSeason();
      const episode = await repo.create({
        seasonId: season.id,
        name: 'To Delete',
      });

      await repo.delete(episode!.id);

      const found = await repo.findById(episode!.id);
      expect(found).toBeNull();
    });
  });
});
