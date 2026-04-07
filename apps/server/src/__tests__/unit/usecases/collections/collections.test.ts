import type { CollectionsRepositoryPort } from '@/api/v1/collections/application/ports/CollectionsRepositoryPort';
import { CreateCollectionUseCase } from '@/api/v1/collections/application/usecases/CreateCollectionUseCase';
import { DeleteCollectionUseCase } from '@/api/v1/collections/application/usecases/DeleteCollectionUseCase';
import { FindCollectionByIdUseCase } from '@/api/v1/collections/application/usecases/FindCollectionByIdUseCase';
import { ReorderCollectionItemsUseCase } from '@/api/v1/collections/application/usecases/ReorderCollectionItemsUseCase';
import { UpdateCollectionUseCase } from '@/api/v1/collections/application/usecases/UpdateCollectionUseCase';
import type { Collection } from '@/api/v1/collections/domain/Collection';

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

            await expect(new CreateCollectionUseCase(repo).execute({ title: 'Favorites' })).resolves.toBeNull();
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
});