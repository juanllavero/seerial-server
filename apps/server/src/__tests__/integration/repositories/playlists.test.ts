import 'reflect-metadata';
import { PlayListModel } from '@/api/v1/playlists/infrastructure/persistence/models/PlayListModel';
import { PlayListRepositoryImpl } from '@/api/v1/playlists/infrastructure/persistence/repositories/PlayListRepositoryImpl';
import {
    clearAllTables,
    closeTestDataSource,
    getTestDataSource,
} from '../../helpers/test-db';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {},
    fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

let repo: PlayListRepositoryImpl;

beforeAll(async () => {
    await getTestDataSource();
    repo = new PlayListRepositoryImpl();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    const ds = await getTestDataSource();
    await clearAllTables(ds);
});

describe('PlayListRepositoryImpl', () => {
    it('creates a playlist row', async () => {
        const created = await repo.create({
            userId: 'user-1',
            title: 'Road Trip',
            description: 'Driving songs',
        } as never);

        const found = await PlayListModel.findOne({ where: { id: created.id } });
        expect(created.id).toBeTruthy();
        expect(found).not.toBeNull();
        expect(found!.title).toBe('Road Trip');
    });

    it('stores multiple playlists', async () => {
        await repo.create({ userId: 'user-1', title: 'A' } as never);
        await repo.create({ userId: 'user-2', title: 'B' } as never);

        const all = await PlayListModel.find();
        expect(all.length).toBe(2);
    });

    it('updates and deletes a playlist', async () => {
        const created = await repo.create({ userId: 'user-1', title: 'Temp' } as never);
        const updated = await repo.update(created.id, { title: 'Updated Title' });

        expect(updated.title).toBe('Updated Title');

        await repo.delete(created.id);
        await expect(PlayListModel.findOne({ where: { id: created.id } })).resolves.toBeNull();
    });
});
