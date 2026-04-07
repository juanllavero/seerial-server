import 'reflect-metadata';
import { AlbumModel } from '@/api/v1/albums/infrastructure/persistence/models/AlbumModel';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { SongsRepositoryImpl } from '@/api/v1/songs/infrastructure/persistence/repositories/SongsRepositoryImpl';
import { LibraryTypes } from '@/data/interfaces/Media';
import {
    clearAllTables,
    closeTestDataSource,
    getTestDataSource,
} from '../../helpers/test-db';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {},
    fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

let repo: SongsRepositoryImpl;

beforeAll(async () => {
    await getTestDataSource();
    repo = new SongsRepositoryImpl();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    const ds = await getTestDataSource();
    await clearAllTables(ds);
});

async function createAlbum() {
    const library = await LibraryModel.save({
        id: `lib-${Math.random().toString(36).slice(2, 10)}`,
        name: 'Music',
        type: LibraryTypes.MUSIC,
        language: 'en',
        folders: [],
        order: 0,
        hidden: false,
    });

    return AlbumModel.save({
        id: `alb-${Math.random().toString(36).slice(2, 10)}`,
        libraryId: library.id,
        title: 'Album',
        folder: '/music/album',
    });
}

describe('SongsRepositoryImpl', () => {
    it('creates and finds song by id/path', async () => {
        const album = await createAlbum();

        const created = await repo.create({
            albumId: album.id,
            fileSrc: '/music/album/song.mp3',
            title: 'Song 1',
            duration: 180,
        });

        const byId = await repo.findById(created!.id);
        const byPath = await repo.findByPath('/music/album/song.mp3');

        expect(byId).not.toBeNull();
        expect(byPath).not.toBeNull();
        expect(byPath!.title).toBe('Song 1');
    });

    it('updates and deletes a song', async () => {
        const album = await createAlbum();
        const created = await repo.create({
            albumId: album.id,
            fileSrc: '/music/album/temp.mp3',
            title: 'Temp',
        });

        const updated = await repo.update(created!.id, { title: 'Updated Song' });
        expect(updated.title).toBe('Updated Song');

        await repo.delete(created!.id);
        await expect(repo.findById(created!.id)).resolves.toBeNull();
    });
});
