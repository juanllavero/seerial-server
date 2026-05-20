/** biome-ignore-all lint/style/noNonNullAssertion: <Test file> */

import 'reflect-metadata';
import { AlbumModel } from '@/api/v1/albums/infrastructure/persistence/models/AlbumModel';
import { CollectionsRepositoryImpl } from '@/api/v1/collections/infrastructure/persistence/repositories/CollectionsRepositoryImpl';
import { LibraryCollectionModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryCollectionModel';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { SeriesModel } from '@/api/v1/series/infrastructure/persistence/models/SeriesModel';
import { DatabaseManager } from '@/api/v1/shared/infrastructure/persistence/DatabaseManager';
import { LibraryTypes } from '@/data/interfaces/Media';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  useCases: {},
  fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

let repo: CollectionsRepositoryImpl;

beforeAll(async () => {
  await getTestDataSource();
  repo = new CollectionsRepositoryImpl();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  const ds = await getTestDataSource();
  await clearAllTables(ds);
});

async function createLibrary(type = LibraryTypes.MOVIES) {
  return LibraryModel.save({
    id: `lib-${Math.random().toString(36).slice(2, 10)}`,
    name: 'Collection Library',
    type,
    language: 'en',
    folders: [],
    order: 0,
    hidden: false,
  });
}

describe('CollectionsRepositoryImpl', () => {
  it('adds and finds a collection by name', async () => {
    const created = await repo.add({ title: 'Favorites' });
    const foundByName = await repo.getByName('Favorites');

    expect(created).not.toBeNull();
    expect(created!.id).toBeTruthy();
    expect(foundByName).not.toBeNull();
    expect(foundByName!.title).toBe('Favorites');
  });

  it('gets collection by id with normalized response', async () => {
    const created = await repo.add({ title: 'By Id Collection' });
    const found = await repo.getById(created!.id);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created!.id);
    expect(found).toHaveProperty('numberOfItems');
  });

  it('updates and deletes collection', async () => {
    const created = await repo.add({ title: 'To Update' });
    const updated = await repo.update(created!.id, {
      title: 'Updated Collection',
    });

    expect(updated.title).toBe('Updated Collection');

    const deleted = await repo.delete(created!.id);
    expect(deleted).toBe(true);
    await expect(repo.getById(created!.id)).resolves.toBeNull();
  });

  it('returns existing collection when add receives an existing title', async () => {
    const first = await repo.add({ title: 'Unique Name' });
    const second = await repo.add({ title: 'Unique Name' });

    expect(second).not.toBeNull();
    expect(second!.id).toBe(first!.id);
  });

  it('adds a collection to a library and returns it from getAll', async () => {
    const library = await createLibrary(LibraryTypes.MOVIES);
    const collection = await repo.add({ title: 'Library Collection' });

    await repo.addLibrary(library.id, collection!.id);

    const relation = await LibraryCollectionModel.findOne({
      where: { libraryId: library.id, collectionId: collection!.id },
    });
    const collections = await repo.getAll(library.id);

    expect(relation).not.toBeNull();
    expect(collections.map((item) => item.id)).toContain(collection!.id);
  });

  it('returns collections by library id for the requested media type', async () => {
    const library = await createLibrary(LibraryTypes.MOVIES);
    const collection = await repo.add({ title: 'Typed Collection' });
    const movie = await MovieModel.save({
      id: `mov-${Math.random().toString(36).slice(2, 10)}`,
      libraryId: library.id,
      name: 'Movie For Collection',
    });

    await repo.addLibrary(library.id, collection!.id);
    await repo.addMovie(collection!.id, movie.id);

    const collections = await repo.getByLibraryId(library.id, 'Movies');

    expect(collections).toHaveLength(1);
    expect(collections[0].id).toBe(collection!.id);
  });

  it('adds and removes movie/series/album relationships', async () => {
    const movieLibrary = await createLibrary(LibraryTypes.MOVIES);
    const showLibrary = await createLibrary(LibraryTypes.SHOWS);
    const musicLibrary = await createLibrary(LibraryTypes.MUSIC);
    const collection = await repo.add({ title: 'Mixed Collection' });

    const movie = await MovieModel.save({
      id: `mov-${Math.random().toString(36).slice(2, 10)}`,
      libraryId: movieLibrary.id,
      name: 'Movie 1',
    });
    const series = await SeriesModel.save({
      id: `ser-${Math.random().toString(36).slice(2, 10)}`,
      libraryId: showLibrary.id,
      name: 'Series 1',
    });
    const album = await AlbumModel.save({
      id: `alb-${Math.random().toString(36).slice(2, 10)}`,
      libraryId: musicLibrary.id,
      title: 'Album 1',
      folder: '/music/album-1',
    });

    await repo.addMovie(collection!.id, movie.id);
    await repo.addSeries(collection!.id, series.id);
    await repo.addAlbum(collection!.id, album.id);

    expect(
      await MovieModel.findOne({ where: { id: movie.id, collectionId: collection!.id } }),
    ).not.toBeNull();
    expect(
      await SeriesModel.findOne({ where: { id: series.id, collectionId: collection!.id } }),
    ).not.toBeNull();
    expect(
      await AlbumModel.findOne({ where: { id: album.id, collectionId: collection!.id } }),
    ).not.toBeNull();

    await repo.removeMovie(collection!.id, movie.id);
    await repo.removeSeries(collection!.id, series.id);
    await repo.removeAlbum(collection!.id, album.id);

    expect(
      await MovieModel.findOne({ where: { id: movie.id, collectionId: collection!.id } }),
    ).toBeNull();
    expect(
      await SeriesModel.findOne({ where: { id: series.id, collectionId: collection!.id } }),
    ).toBeNull();
    expect(
      await AlbumModel.findOne({ where: { id: album.id, collectionId: collection!.id } }),
    ).toBeNull();
  });

  it('reorders collection content across media types', async () => {
    const ds = await getTestDataSource();
    const dataSourceSpy = jest.spyOn(DatabaseManager, 'getDataSource').mockReturnValue(ds);

    const movieLibrary = await createLibrary(LibraryTypes.MOVIES);
    const showLibrary = await createLibrary(LibraryTypes.SHOWS);
    const collection = await repo.add({ title: 'Reorder Collection' });

    const movie = await MovieModel.save({
      id: `mov-${Math.random().toString(36).slice(2, 10)}`,
      libraryId: movieLibrary.id,
      name: 'Movie A',
    });
    const series = await SeriesModel.save({
      id: `ser-${Math.random().toString(36).slice(2, 10)}`,
      libraryId: showLibrary.id,
      name: 'Series A',
    });

    await repo.addMovie(collection!.id, movie.id);
    await repo.addSeries(collection!.id, series.id);

    await repo.reorderContent(collection!.id, [
      { id: series.id, type: 'series' },
      { id: movie.id, type: 'movie' },
    ]);

    const orderedSeries = await SeriesModel.findOne({ where: { id: series.id } });
    const orderedMovie = await MovieModel.findOne({ where: { id: movie.id } });

    expect(orderedSeries!.collectionOrder).toBe(0);
    expect(orderedMovie!.collectionOrder).toBe(1);

    dataSourceSpy.mockRestore();
  });

  it('throws when reordering content without a database connection', async () => {
    const dataSourceSpy = jest
      .spyOn(DatabaseManager, 'getDataSource')
      .mockReturnValue(null as never);

    await expect(repo.reorderContent('collection-1', [])).rejects.toThrow(
      'Database not initialized',
    );

    dataSourceSpy.mockRestore();
  });

  it('rolls back the reorder transaction when an update fails', async () => {
    const queryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        update: jest.fn().mockRejectedValue(new Error('boom')),
      },
    };
    const dataSourceSpy = jest.spyOn(DatabaseManager, 'getDataSource').mockReturnValue({
      createQueryRunner: () => queryRunner,
    } as never);

    await expect(
      repo.reorderContent('collection-1', [{ id: 'movie-1', type: 'movie' }]),
    ).rejects.toThrow('boom');

    expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
    expect(queryRunner.release).toHaveBeenCalled();

    dataSourceSpy.mockRestore();
  });
});
