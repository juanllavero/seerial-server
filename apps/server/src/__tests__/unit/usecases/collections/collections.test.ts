import type { CollectionsRepositoryPort } from '@/api/v1/collections/application/ports/CollectionsRepositoryPort';
import { AddAlbumToCollectionUseCase } from '@/api/v1/collections/application/usecases/AddAlbumToCollectionUseCase';
import { AddLibraryToCollectionUseCase } from '@/api/v1/collections/application/usecases/AddLibraryUseCase';
import { CreateCollectionUseCase } from '@/api/v1/collections/application/usecases/CreateCollectionUseCase';
import { DeleteCollectionUseCase } from '@/api/v1/collections/application/usecases/DeleteCollectionUseCase';
import { FindCollectionByIdUseCase } from '@/api/v1/collections/application/usecases/FindCollectionByIdUseCase';
import { FindCollectionsInLibraryUseCase } from '@/api/v1/collections/application/usecases/FindCollectionsInLibraryUseCase';
import { GetMusicExtrasUseCase } from '@/api/v1/collections/application/usecases/GetMusicExtrasUseCase';
import { ReorderCollectionItemsUseCase } from '@/api/v1/collections/application/usecases/ReorderCollectionItemsUseCase';
import { UpdateCollectionUseCase } from '@/api/v1/collections/application/usecases/UpdateCollectionUseCase';
import type { Collection } from '@/api/v1/collections/domain/Collection';

jest.mock('@/api/v1/shared/infrastructure/services/MediaDetailsService', () => ({
  findMusicExtras: jest.fn(),
}));

const mockFindMusicExtras = jest.requireMock(
  '@/api/v1/shared/infrastructure/services/MediaDetailsService',
).findMusicExtras as jest.Mock;

function buildCollection(overrides: Partial<Collection> = {}): Collection {
  return {
    id: 'collection-1',
    title: 'Favorites',
    description: 'Picked items',
    ...overrides,
  } as unknown as Collection;
}

function buildCollectionsRepo(
  overrides: Partial<CollectionsRepositoryPort> = {},
): CollectionsRepositoryPort {
  return {
    getAll: jest.fn(),
    getById: jest.fn(),
    getByName: jest.fn(),
    add: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addAlbum: jest.fn(),
    addMovie: jest.fn(),
    addSeries: jest.fn(),
    addLibrary: jest.fn(),
    reorderContent: jest.fn(),
    ...overrides,
  };
}

describe('Collection use cases', () => {
  describe('CreateCollectionUseCase', () => {
    it('creates a collection through the repository', async () => {
      const collection = buildCollection();
      const repo = buildCollectionsRepo({ add: jest.fn().mockResolvedValue(collection) });

      const result = await new CreateCollectionUseCase(repo).execute({ title: 'Favorites' });

      expect(result).toEqual(collection);
      expect(repo.add).toHaveBeenCalledWith({ title: 'Favorites' });
    });

    it('returns null when the repository declines to create the collection', async () => {
      const repo = buildCollectionsRepo({ add: jest.fn().mockResolvedValue(null) });

      await expect(
        new CreateCollectionUseCase(repo).execute({ title: 'Favorites' }),
      ).resolves.toBeNull();
    });
  });

  describe('FindCollectionByIdUseCase', () => {
    it('returns the collection by id', async () => {
      const collection = buildCollection();
      const repo = buildCollectionsRepo({ getById: jest.fn().mockResolvedValue(collection) });

      const result = await new FindCollectionByIdUseCase(repo).execute(collection.id);

      expect(result).toEqual(collection);
      expect(repo.getById).toHaveBeenCalledWith(collection.id);
    });

    it('returns null when the collection does not exist', async () => {
      const repo = buildCollectionsRepo({ getById: jest.fn().mockResolvedValue(null) });

      await expect(new FindCollectionByIdUseCase(repo).execute('missing')).resolves.toBeNull();
    });
  });

  describe('UpdateCollectionUseCase', () => {
    it('updates the collection through the repository', async () => {
      const collection = buildCollection({ title: 'Updated Favorites' });
      const repo = buildCollectionsRepo({ update: jest.fn().mockResolvedValue(collection) });

      const result = await new UpdateCollectionUseCase(repo).execute('collection-1', {
        title: 'Updated Favorites',
      });

      expect(result).toEqual(collection);
      expect(repo.update).toHaveBeenCalledWith('collection-1', {
        title: 'Updated Favorites',
      });
    });
  });

  describe('DeleteCollectionUseCase', () => {
    it('returns the repository deletion result', async () => {
      const repo = buildCollectionsRepo({ delete: jest.fn().mockResolvedValue(true) });

      await expect(new DeleteCollectionUseCase(repo).execute('collection-1')).resolves.toBe(true);
      expect(repo.delete).toHaveBeenCalledWith('collection-1');
    });
  });

  describe('ReorderCollectionItemsUseCase', () => {
    it('delegates item ordering to the repository', async () => {
      const orderedItems = [{ id: 'movie-1', type: 'movie' }];
      const repo = buildCollectionsRepo({ reorderContent: jest.fn().mockResolvedValue(undefined) });

      await new ReorderCollectionItemsUseCase(repo).execute('collection-1', orderedItems);

      expect(repo.reorderContent).toHaveBeenCalledWith('collection-1', orderedItems);
    });
  });

  describe('Additional collection use cases', () => {
    it('adds an album to a collection through the repository', async () => {
      const repo = buildCollectionsRepo({ addAlbum: jest.fn().mockResolvedValue(undefined) });

      await expect(
        new AddAlbumToCollectionUseCase(repo).execute('collection-1', 'album-1'),
      ).resolves.toBeUndefined();
      expect(repo.addAlbum).toHaveBeenCalledWith('collection-1', 'album-1');
    });

    it('adds a collection to a library through the repository', async () => {
      const repo = buildCollectionsRepo({ addLibrary: jest.fn().mockResolvedValue(undefined) });

      await expect(
        new AddLibraryToCollectionUseCase(repo).execute('library-1', 'collection-1'),
      ).resolves.toBeUndefined();
      expect(repo.addLibrary).toHaveBeenCalledWith('library-1', 'collection-1');
    });

    it('finds collections in a specific library', async () => {
      const collections = [buildCollection({ id: 'collection-2' })];
      const repo = buildCollectionsRepo({ getAll: jest.fn().mockResolvedValue(collections) });

      await expect(new FindCollectionsInLibraryUseCase(repo).execute('library-1')).resolves.toEqual(
        collections,
      );
      expect(repo.getAll).toHaveBeenCalledWith('library-1');
    });

    it('returns music extras for a collection', async () => {
      const extras = [{ id: 'extra-1', title: 'Live Track' }];
      mockFindMusicExtras.mockResolvedValue(extras);

      await expect(new GetMusicExtrasUseCase().execute('collection-1')).resolves.toEqual(extras);
      expect(mockFindMusicExtras).toHaveBeenCalledWith('collection-1');
    });
  });
});
