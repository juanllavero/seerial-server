import 'reflect-metadata';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { MoviesRepositoryImpl } from '@/api/v1/movies/infrastructure/persistence/repositories/MoviesRepositoryImpl';
import { LibraryTypes } from '@/data/interfaces/Media';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {},
    fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
}));

let repo: MoviesRepositoryImpl;

beforeAll(async () => {
    await getTestDataSource();
    repo = new MoviesRepositoryImpl();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    const ds = await getTestDataSource();
    await clearAllTables(ds);
});

async function createLibrary(name = 'Movies Library') {
    return LibraryModel.save({
        id: `lib-${Math.random().toString(36).slice(2, 10)}`,
        name,
        type: LibraryTypes.MOVIES,
        language: 'en',
        folders: [],
        order: 0,
        hidden: false,
    });
}

describe('MoviesRepositoryImpl', () => {
    describe('create / findById', () => {
        it('creates a movie with a generated id', async () => {
            const library = await createLibrary();

            const movie = await repo.create({ libraryId: library.id, name: 'Inception' });

            expect(movie).not.toBeNull();
            expect(movie.id).toBeTruthy();
            expect(movie.name).toBe('Inception');
            expect(movie.libraryId).toBe(library.id);
        });

        it('findById returns the movie for a valid id', async () => {
            const library = await createLibrary();
            const created = await repo.create({ libraryId: library.id, name: 'Interstellar' });

            const found = await repo.findById(created.id);

            expect(found).not.toBeNull();
            expect(found!.id).toBe(created.id);
            expect(found!.name).toBe('Interstellar');
        });

        it('findById returns null for a non-existent id', async () => {
            const found = await repo.findById('nonexistent-id');
            expect(found).toBeNull();
        });
    });

    describe('findAll', () => {
        it('returns an empty array when the library has no movies', async () => {
            const library = await createLibrary();
            const movies = await repo.findAll(library.id);
            expect(movies).toEqual([]);
        });

        it('returns all movies for a given library', async () => {
            const library = await createLibrary();
            await repo.create({ libraryId: library.id, name: 'Movie A' });
            await repo.create({ libraryId: library.id, name: 'Movie B' });

            const movies = await repo.findAll(library.id);
            expect(movies).toHaveLength(2);
        });

        it('does not return movies from a different library', async () => {
            const lib1 = await createLibrary('Lib 1');
            const lib2 = await createLibrary('Lib 2');
            await repo.create({ libraryId: lib1.id, name: 'Only in Lib 1' });

            const movies = await repo.findAll(lib2.id);
            expect(movies).toHaveLength(0);
        });
    });

    describe('update', () => {
        it('updates the movie name', async () => {
            const library = await createLibrary();
            const movie = await repo.create({ libraryId: library.id, name: 'Old Name' });

            const updated = await repo.update(movie.id, { name: 'New Name' });

            expect(updated.name).toBe('New Name');
        });

        it('throws for an empty id', async () => {
            await expect(repo.update('', { name: 'x' })).rejects.toMatchObject({ statusCode: 400 });
        });
    });

    describe('delete', () => {
        it('deletes the movie so it can no longer be found', async () => {
            const library = await createLibrary();
            const movie = await repo.create({ libraryId: library.id, name: 'To Delete' });

            await repo.delete(movie.id);

            const found = await repo.findById(movie.id);
            expect(found).toBeNull();
        });

        it('throws for an empty id', async () => {
            await expect(repo.delete('')).rejects.toMatchObject({ statusCode: 400 });
        });
    });
});
