import type { AlbumsRepositoryPort } from '@/api/v1/albums/application/ports/AlbumsRepositoryPort';
import { AddArtistToAlbumUseCase } from '@/api/v1/albums/application/usecases/AddArtistToAlbumUseCase';
import { CreateAlbumUseCase } from '@/api/v1/albums/application/usecases/CreateAlbumUseCase';
import { DeleteAlbumUseCase } from '@/api/v1/albums/application/usecases/DeleteAlbumUseCase';
import { FindAlbumByIdUseCase } from '@/api/v1/albums/application/usecases/FindAlbumByIdUseCase';
import { FindAllAlbumsUseCase } from '@/api/v1/albums/application/usecases/FindAllAlbumsUseCase';
import { UpdateAlbumUseCase } from '@/api/v1/albums/application/usecases/UpdateAlbumUseCase';
import type { Album } from '@/api/v1/albums/domain/Album';

function buildAlbum(overrides: Partial<Album> = {}): Album {
    return {
        id: 'album-1',
        title: 'Discovery',
        libraryId: 'library-1',
        ...overrides,
    } as unknown as Album;
}

function buildAlbumsRepo(overrides: Partial<AlbumsRepositoryPort> = {}): AlbumsRepositoryPort {
    return {
        findAll: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        addArtistToAlbum: jest.fn(),
        ...overrides,
    };
}

describe('Album use cases', () => {
    describe('CreateAlbumUseCase', () => {
        it('creates an album through the repository', async () => {
            const album = buildAlbum();
            const repo = buildAlbumsRepo({ create: jest.fn().mockResolvedValue(album) });

            const result = await new CreateAlbumUseCase(repo).execute({ title: 'Discovery' });

            expect(result).toEqual(album);
            expect(repo.create).toHaveBeenCalledWith({ title: 'Discovery' });
        });
    });

    describe('FindAlbumByIdUseCase', () => {
        it('returns an album by id', async () => {
            const album = buildAlbum();
            const repo = buildAlbumsRepo({ findById: jest.fn().mockResolvedValue(album) });

            const result = await new FindAlbumByIdUseCase(repo).execute(album.id);

            expect(result).toEqual(album);
            expect(repo.findById).toHaveBeenCalledWith(album.id);
        });

        it('returns null when the album does not exist', async () => {
            const repo = buildAlbumsRepo({ findById: jest.fn().mockResolvedValue(null) });

            await expect(new FindAlbumByIdUseCase(repo).execute('missing')).resolves.toBeNull();
        });
    });

    describe('FindAllAlbumsUseCase', () => {
        it('returns all albums for a library', async () => {
            const albums = [buildAlbum(), buildAlbum({ id: 'album-2', title: 'Random Access Memories' })];
            const repo = buildAlbumsRepo({ findAll: jest.fn().mockResolvedValue(albums) });

            const result = await new FindAllAlbumsUseCase(repo).execute('library-1');

            expect(result).toEqual(albums);
            expect(repo.findAll).toHaveBeenCalledWith('library-1');
        });
    });

    describe('UpdateAlbumUseCase', () => {
        it('updates an album through the repository', async () => {
            const album = buildAlbum({ title: 'Updated Discovery' });
            const repo = buildAlbumsRepo({ update: jest.fn().mockResolvedValue(album) });

            const result = await new UpdateAlbumUseCase(repo).execute('album-1', {
                title: 'Updated Discovery',
            });

            expect(result).toEqual(album);
            expect(repo.update).toHaveBeenCalledWith('album-1', {
                title: 'Updated Discovery',
            });
        });
    });

    describe('DeleteAlbumUseCase', () => {
        it('deletes the album through the repository', async () => {
            const repo = buildAlbumsRepo({ delete: jest.fn().mockResolvedValue(undefined) });

            await expect(new DeleteAlbumUseCase(repo).execute('album-1')).resolves.toBeUndefined();
            expect(repo.delete).toHaveBeenCalledWith('album-1');
        });
    });

    describe('AddArtistToAlbumUseCase', () => {
        it('links an artist to an album through the repository', async () => {
            const relation = { id: 'album-artist-1', artistId: 'artist-1', albumId: 'album-1' };
            const repo = buildAlbumsRepo({ addArtistToAlbum: jest.fn().mockResolvedValue(relation) });

            const result = await new AddArtistToAlbumUseCase(repo).execute('artist-1', 'album-1');

            expect(result).toEqual(relation);
            expect(repo.addArtistToAlbum).toHaveBeenCalledWith('artist-1', 'album-1');
        });
    });
});