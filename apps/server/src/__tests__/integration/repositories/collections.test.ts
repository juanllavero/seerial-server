import 'reflect-metadata';
import { CollectionsRepositoryImpl } from '@/api/v1/collections/infrastructure/persistence/repositories/CollectionsRepositoryImpl';
import {
    clearAllTables,
    closeTestDataSource,
    getTestDataSource,
} from '../../helpers/test-db';

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
        const updated = await repo.update(created!.id, { title: 'Updated Collection' });

        expect(updated.title).toBe('Updated Collection');

        const deleted = await repo.delete(created!.id);
        expect(deleted).toBe(true);
        await expect(repo.getById(created!.id)).resolves.toBeNull();
    });
});
