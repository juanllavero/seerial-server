import 'reflect-metadata';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { MovieModel } from '@/api/v1/movies/infrastructure/persistence/models/MovieModel';
import { VideosRepositoryImpl } from '@/api/v1/videos/infrastructure/persistence/repositories/VideosRepositoryImpl';
import { LibraryTypes } from '@/data/interfaces/Media';
import { clearAllTables, closeTestDataSource, getTestDataSource } from '../../helpers/test-db';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {
        getMoviebyId: jest.fn().mockReturnValue({ execute: jest.fn().mockResolvedValue(null) }),
        getEpisodeById: jest.fn().mockReturnValue({ execute: jest.fn().mockResolvedValue(null) }),
        getServerConfig: jest.fn().mockReturnValue({ execute: jest.fn().mockResolvedValue(null) }),
    },
    fileSystemService: { getExternalPath: jest.fn().mockReturnValue('/test') },
    mediaInfoService: { getMediaInformation: jest.fn().mockResolvedValue(null) },
}));

// mediaInfo adapter uses ffprobe; avoid real invocations in repository tests
jest.mock('@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo', () => ({
    getMediaInfo: jest.fn().mockResolvedValue(null),
}));

let repo: VideosRepositoryImpl;

beforeAll(async () => {
    await getTestDataSource();
    repo = new VideosRepositoryImpl();
});

afterAll(async () => {
    await closeTestDataSource();
});

beforeEach(async () => {
    const ds = await getTestDataSource();
    await clearAllTables(ds);
});

async function createMovie() {
    const library = await LibraryModel.save({
        id: `lib-${Math.random().toString(36).slice(2, 10)}`,
        name: 'Movies Library',
        type: LibraryTypes.MOVIES,
        language: 'en',
        folders: [],
        order: 0,
        hidden: false,
    });

    return MovieModel.save({
        id: `mov-${Math.random().toString(36).slice(2, 10)}`,
        libraryId: library.id,
        name: 'Test Movie',
    });
}

describe('VideosRepositoryImpl', () => {
    describe('create / findById', () => {
        it('creates a video with a generated id', async () => {
            const movie = await createMovie();

            const video = await repo.create({
                id: '',
                movieId: movie.id,
                fileSrc: '/movies/test.mp4',
                title: 'Test Video',
                runtime: 120,
                hash: '',
                imgSrc: '',
                imgUrls: [],
            } as never);

            expect(video).not.toBeNull();
            expect(video.id).toBeTruthy();
            expect(video.fileSrc).toBe('/movies/test.mp4');
        });

        it('findById returns the video for a valid id', async () => {
            const movie = await createMovie();
            const created = await repo.create({
                movieId: movie.id,
                fileSrc: '/movies/find-me.mp4',
                title: '',
                runtime: 0,
                hash: '',
                imgSrc: '',
                imgUrls: [],
            } as never);

            const found = await repo.findById(created.id);

            expect(found).not.toBeNull();
            expect(found!.fileSrc).toBe('/movies/find-me.mp4');
        });

        it('findById returns null for a non-existent id', async () => {
            const found = await repo.findById('nonexistent');
            expect(found).toBeNull();
        });
    });

    describe('findByMovieId', () => {
        it('returns videos that belong to a movie', async () => {
            const movie = await createMovie();
            await repo.create({ movieId: movie.id, fileSrc: '/movies/a.mp4', title: '', runtime: 0, hash: '', imgSrc: '', imgUrls: [] } as never);
            await repo.create({ movieId: movie.id, fileSrc: '/movies/b.mp4', title: '', runtime: 0, hash: '', imgSrc: '', imgUrls: [] } as never);

            const videos = await repo.findByMovieId(movie.id);
            expect(videos).toHaveLength(2);
        });

        it('returns an empty array when the movie has no videos', async () => {
            const movie = await createMovie();
            const videos = await repo.findByMovieId(movie.id);
            expect(videos).toHaveLength(0);
        });
    });

    describe('findByPath', () => {
        it('returns the video matching the file path', async () => {
            const movie = await createMovie();
            await repo.create({ movieId: movie.id, fileSrc: '/movies/unique.mp4', title: '', runtime: 0, hash: '', imgSrc: '', imgUrls: [] } as never);

            const found = await repo.findByPath('/movies/unique.mp4');
            expect(found).not.toBeNull();
            expect(found!.fileSrc).toBe('/movies/unique.mp4');
        });

        it('returns null when no video matches the path', async () => {
            const found = await repo.findByPath('/movies/missing.mp4');
            expect(found).toBeNull();
        });
    });

    describe('update', () => {
        it('updates the video title', async () => {
            const movie = await createMovie();
            const video = await repo.create({ movieId: movie.id, fileSrc: '/movies/update.mp4', title: 'Old', runtime: 0, hash: '', imgSrc: '', imgUrls: [] } as never);

            const updated = await repo.update(video.id, { title: 'New Title' });

            expect(updated.title).toBe('New Title');
        });

        it('throws for an empty id', async () => {
            await expect(repo.update('', { title: 'x' })).rejects.toMatchObject({ statusCode: 400 });
        });
    });

    describe('delete', () => {
        it('deletes the video so it can no longer be found', async () => {
            const movie = await createMovie();
            const video = await repo.create({ movieId: movie.id, fileSrc: '/movies/delete.mp4', title: '', runtime: 0, hash: '', imgSrc: '', imgUrls: [] } as never);

            await repo.delete(video.id);

            const found = await repo.findById(video.id);
            expect(found).toBeNull();
        });
    });
});
