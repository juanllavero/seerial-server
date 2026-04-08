/** biome-ignore-all lint/style/noNonNullAssertion: <Test file> */

import 'reflect-metadata';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { SeasonsRepositoryImpl } from '@/api/v1/seasons/infrastructure/persistence/repositories/SeasonsRepositoryImpl';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
import { LibraryTypes } from '@/data/interfaces/Media';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {},
  fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

let repo: SeasonsRepositoryImpl;

beforeAll(async () => {
  await getTestDataSource();
  repo = new SeasonsRepositoryImpl();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  const ds = await getTestDataSource();
  await clearAllTables(ds);
});

async function createSeries() {
  const library = await LibraryModel.save({
    id: `lib-${Math.random().toString(36).slice(2, 10)}`,
    name: 'Shows Library',
    type: LibraryTypes.SHOWS,
    language: 'en',
    folders: [],
    order: 0,
    hidden: false,
  });

  return SeriesModel.save({
    id: `ser-${Math.random().toString(36).slice(2, 10)}`,
    libraryId: library.id,
    name: 'Test Series',
  });
}

describe('SeasonsRepositoryImpl', () => {
  describe('create / findById', () => {
    it('creates a season with a generated id', async () => {
      const series = await createSeries();

      const season = await repo.create({ seriesId: series.id, name: 'Season 1', order: 1 });

      expect(season).not.toBeNull();
      expect(season.id).toBeTruthy();
      expect(season.name).toBe('Season 1');
      expect(season.seriesId).toBe(series.id);
    });

    it('findById returns the season for a valid id', async () => {
      const series = await createSeries();
      const created = await repo.create({ seriesId: series.id, name: 'Season 2', order: 2 });

      const found = await repo.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
    });

    it('findById returns null for a non-existent id', async () => {
      const found = await repo.findById('nonexistent');
      expect(found).toBeNull();
    });

    it('returns the existing season when created with the same id twice', async () => {
      const series = await createSeries();
      const first = await repo.create({ seriesId: series.id, name: 'Season 1', order: 1 });
      const second = await repo.create({
        id: first.id,
        seriesId: series.id,
        name: 'Season 1 Duplicate',
        order: 1,
      });

      expect(second.id).toBe(first.id);
      expect(second.name).toBe('Season 1');
    });
  });

  describe('findAll / findSeasonsBySeriesId', () => {
    it('returns an empty array when the series has no seasons', async () => {
      const series = await createSeries();
      const result = await repo.findAll(series.id);
      expect(result).toEqual([]);
    });

    it('returns all seasons for a given series', async () => {
      const series = await createSeries();
      await repo.create({ seriesId: series.id, name: 'S1', order: 1 });
      await repo.create({ seriesId: series.id, name: 'S2', order: 2 });

      const result = await repo.findAll(series.id);
      expect(result).toHaveLength(2);
    });

    it('findSeasonsBySeriesId mirrors findAll result', async () => {
      const series = await createSeries();
      await repo.create({ seriesId: series.id, name: 'S1', order: 1 });

      const a = await repo.findAll(series.id);
      const b = await repo.findSeasonsBySeriesId(series.id);
      expect(a).toHaveLength(b.length);
    });
  });

  describe('update', () => {
    it('updates the season name', async () => {
      const series = await createSeries();
      const season = await repo.create({ seriesId: series.id, name: 'Old Name', order: 1 });

      const updated = await repo.update(season.id, { name: 'New Name' });

      expect(updated.name).toBe('New Name');
    });

    it('throws for an empty id', async () => {
      await expect(repo.update('', { name: 'x' })).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('delete', () => {
    it('deletes the season so it can no longer be found', async () => {
      const series = await createSeries();
      const season = await repo.create({ seriesId: series.id, name: 'To Delete', order: 1 });

      await repo.delete(season.id);

      const found = await repo.findById(season.id);
      expect(found).toBeNull();
    });
  });
});
