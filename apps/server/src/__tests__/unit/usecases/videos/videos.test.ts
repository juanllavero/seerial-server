import type { PlayBackInfo } from '@seerial/domain';
import type { LibrariesRepositoryPort } from '@/api/v1/libraries/application/ports/LibrariesRepositoryPort';
import type { FileSystemServicePort } from '@/api/v1/shared/application/ports/FileSystemServicePort';
import type { VideoRepositoryPort } from '@/api/v1/videos/application/ports/VideosRepositoryPort';
import { DeleteVideoDataUseCase } from '@/api/v1/videos/application/usecases/DeleteVideoDataUseCase';
import { DeleteVideoUseCase } from '@/api/v1/videos/application/usecases/DeleteVideoUseCase';
import { FindVideoByIdUseCase } from '@/api/v1/videos/application/usecases/FindVideoByIdUseCase';
import { FindVideoByPathUseCase } from '@/api/v1/videos/application/usecases/FindVideoByPathUseCase';
import { GetVideoPlaybackInfoUseCase } from '@/api/v1/videos/application/usecases/GetVideoPlaybackInfoUseCase';
import { UpdateMediaInfoUseCase } from '@/api/v1/videos/application/usecases/UpdateMediaInfoUseCase';
import { UpdateVideoUseCase } from '@/api/v1/videos/application/usecases/UpdateVideosUseCase';
import type { Video } from '@/api/v1/videos/domain/Video';

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    useCases: {
        deleteVideoData: jest.fn(),
    },
}));

jest.mock('@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo', () => ({
    getMediaInfo: jest.fn(),
}));

const mockContainer = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container') as {
    useCases: {
        deleteVideoData: jest.Mock;
    };
};

const mockGetMediaInfo = jest.requireMock(
    '@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo',
).getMediaInfo as jest.Mock;

function buildVideo(overrides: Partial<Video> = {}): Video {
    return {
        id: 'video-1',
        fileSrc: '/media/video-1.mkv',
        mediaInfo: null,
        videoTracks: [],
        subtitleTracks: [],
        audioTracks: [],
        chapters: [],
        runtime: 0,
        ...overrides,
    } as unknown as Video;
}

function buildVideoRepo(overrides: Partial<VideoRepositoryPort> = {}): VideoRepositoryPort {
    return {
        findById: jest.fn(),
        findByEpisodeId: jest.fn(),
        findByMovieId: jest.fn(),
        findByExtraId: jest.fn(),
        findByPath: jest.fn(),
        getVideoPlaybackInfo: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        addAsMovie: jest.fn(),
        addAsMovieExtra: jest.fn(),
        addAsEpisode: jest.fn(),
        ...overrides,
    };
}

function buildLibrariesRepo(overrides: Partial<LibrariesRepositoryPort> = {}): LibrariesRepositoryPort {
    return {
        getAll: jest.fn(),
        getContent: jest.fn(),
        getById: jest.fn(),
        getByAlbumId: jest.fn(),
        getByMovieId: jest.fn(),
        getBySeriesId: jest.fn(),
        getBySeasonId: jest.fn(),
        getByVideoId: jest.fn(),
        reorder: jest.fn(),
        reorderItems: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        addAnalyzedFolder: jest.fn(),
        addAnalyzedFile: jest.fn(),
        removeAnalyzedFile: jest.fn(),
        removeAnalyzedFolder: jest.fn(),
        ...overrides,
    };
}

function buildFileSystemService(overrides: Partial<FileSystemServicePort> = {}): FileSystemServicePort {
    return {
        join: jest.fn(),
        dirname: jest.fn(),
        basename: jest.fn(),
        extname: jest.fn(),
        isFile: jest.fn(),
        getExternalPath: jest.fn(),
        getFolderFiles: jest.fn(),
        getFolderNames: jest.fn(),
        getAbsolutePath: jest.fn(),
        createFolder: jest.fn(),
        createFile: jest.fn(),
        readFile: jest.fn(),
        writeFile: jest.fn(),
        readJsonFile: jest.fn(),
        writeJsonFile: jest.fn(),
        deleteFolder: jest.fn(),
        deleteFile: jest.fn(),
        moveFile: jest.fn(),
        copyFile: jest.fn(),
        exists: jest.fn(),
        ...overrides,
    } as unknown as FileSystemServicePort;
}

describe('Video use cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockContainer.useCases.deleteVideoData.mockReturnValue({ execute: jest.fn().mockResolvedValue(undefined) });
    });

    describe('FindVideoByIdUseCase', () => {
        it('returns the video from the repository', async () => {
            const video = buildVideo();
            const repo = buildVideoRepo({ findById: jest.fn().mockResolvedValue(video) });

            const result = await new FindVideoByIdUseCase(repo).execute(video.id);

            expect(result).toEqual(video);
            expect(repo.findById).toHaveBeenCalledWith(video.id);
        });
    });

    describe('FindVideoByPathUseCase', () => {
        it('delegates video lookup by path', async () => {
            const video = buildVideo();
            const repo = buildVideoRepo({ findByPath: jest.fn().mockResolvedValue(video) });

            const result = await new FindVideoByPathUseCase(repo).execute(video.fileSrc);

            expect(result).toEqual(video);
            expect(repo.findByPath).toHaveBeenCalledWith(video.fileSrc);
        });
    });

    describe('GetVideoPlaybackInfoUseCase', () => {
        it('returns playback info from the repository', async () => {
            const playbackInfo = { videoId: 'video-1', path: '/media/video-1.mkv' } as unknown as PlayBackInfo;
            const repo = buildVideoRepo({ getVideoPlaybackInfo: jest.fn().mockResolvedValue(playbackInfo) });

            const result = await new GetVideoPlaybackInfoUseCase(repo).execute('video-1');

            expect(result).toEqual(playbackInfo);
            expect(repo.getVideoPlaybackInfo).toHaveBeenCalledWith('video-1');
        });
    });

    describe('UpdateVideoUseCase', () => {
        it('updates the video through the repository', async () => {
            const video = buildVideo({ runtime: 125 });
            const repo = buildVideoRepo({ update: jest.fn().mockResolvedValue(video) });

            const result = await new UpdateVideoUseCase(repo).execute(video.id, { runtime: 125 } as never);

            expect(result).toEqual(video);
            expect(repo.update).toHaveBeenCalledWith(video.id, { runtime: 125 });
        });
    });

    describe('UpdateMediaInfoUseCase', () => {
        it('throws when the video does not exist', async () => {
            const repo = buildVideoRepo({ findById: jest.fn().mockResolvedValue(null) });

            await expect(new UpdateMediaInfoUseCase(repo).execute('missing')).rejects.toMatchObject({
                statusCode: 404,
            });
        });

        it('throws when media info extraction returns nothing', async () => {
            const video = buildVideo();
            const repo = buildVideoRepo({ findById: jest.fn().mockResolvedValue(video) });
            mockGetMediaInfo.mockResolvedValue(null);

            await expect(new UpdateMediaInfoUseCase(repo).execute(video.id)).rejects.toMatchObject({
                statusCode: 404,
            });
        });

        it('updates persisted video fields from extracted media info', async () => {
            const video = buildVideo();
            const extractedMediaInfo = {
                mediaInfo: { format: { filename: video.fileSrc } },
                videoTracks: [{ codec: 'h264' }],
                subtitleTracks: [{ language: 'en' }],
                audioTracks: [{ codec: 'aac' }],
                chapters: [{ id: 1, title: 'Intro' }],
                duration: 5420,
            };
            const repo = buildVideoRepo({
                findById: jest.fn().mockResolvedValue(video),
                update: jest.fn().mockImplementation(async (_id, data) => data as Video),
            });
            mockGetMediaInfo.mockResolvedValue(extractedMediaInfo);

            const result = await new UpdateMediaInfoUseCase(repo).execute(video.id);

            expect(mockGetMediaInfo).toHaveBeenCalledWith(video.fileSrc);
            expect(repo.update).toHaveBeenCalledWith(video.id, expect.objectContaining({
                mediaInfo: extractedMediaInfo.mediaInfo,
                videoTracks: extractedMediaInfo.videoTracks,
                subtitleTracks: extractedMediaInfo.subtitleTracks,
                audioTracks: extractedMediaInfo.audioTracks,
                chapters: extractedMediaInfo.chapters,
                runtime: extractedMediaInfo.duration,
            }));
            expect(result).toEqual(expect.objectContaining({
                runtime: 5420,
            }));
        });
    });

    describe('DeleteVideoDataUseCase', () => {
        it('deletes thumbnail and chapter folders for the video', async () => {
            const fileSystemService = buildFileSystemService({ deleteFolder: jest.fn() });

            await new DeleteVideoDataUseCase(fileSystemService).execute('video-1');

            expect(fileSystemService.deleteFolder).toHaveBeenNthCalledWith(
                1,
                'resources/img/thumbnails/video/video-1',
            );
            expect(fileSystemService.deleteFolder).toHaveBeenNthCalledWith(
                2,
                'resources/img/thumbnails/chapters/video-1',
            );
        });
    });

    describe('DeleteVideoUseCase', () => {
        it('throws when the video does not exist', async () => {
            const videoRepo = buildVideoRepo({ findById: jest.fn().mockResolvedValue(null) });

            await expect(
                new DeleteVideoUseCase(videoRepo, buildLibrariesRepo()).execute('missing'),
            ).rejects.toMatchObject({ statusCode: 404 });
        });

        it('deletes video data, analyzed file entry, and the video row', async () => {
            const video = buildVideo();
            const deleteVideoDataExecute = jest.fn().mockResolvedValue(undefined);
            mockContainer.useCases.deleteVideoData.mockReturnValue({ execute: deleteVideoDataExecute });

            const videoRepo = buildVideoRepo({
                findById: jest.fn().mockResolvedValue(video),
                delete: jest.fn().mockResolvedValue(undefined),
            });
            const librariesRepo = buildLibrariesRepo({
                getByVideoId: jest.fn().mockResolvedValue({ id: 'library-1' }),
                removeAnalyzedFile: jest.fn().mockResolvedValue(undefined),
            });

            await new DeleteVideoUseCase(videoRepo, librariesRepo).execute(video.id);

            expect(deleteVideoDataExecute).toHaveBeenCalledWith(video.id);
            expect(librariesRepo.removeAnalyzedFile).toHaveBeenCalledWith('library-1', video.fileSrc);
            expect(videoRepo.delete).toHaveBeenCalledWith(video.id);
        });

        it('skips analyzed-file cleanup when the library cannot be found', async () => {
            const video = buildVideo();
            const deleteVideoDataExecute = jest.fn().mockResolvedValue(undefined);
            mockContainer.useCases.deleteVideoData.mockReturnValue({ execute: deleteVideoDataExecute });

            const videoRepo = buildVideoRepo({
                findById: jest.fn().mockResolvedValue(video),
                delete: jest.fn().mockResolvedValue(undefined),
            });
            const librariesRepo = buildLibrariesRepo({
                getByVideoId: jest.fn().mockResolvedValue(null),
                removeAnalyzedFile: jest.fn(),
            });

            await new DeleteVideoUseCase(videoRepo, librariesRepo).execute(video.id);

            expect(deleteVideoDataExecute).toHaveBeenCalledWith(video.id);
            expect(librariesRepo.removeAnalyzedFile).not.toHaveBeenCalled();
            expect(videoRepo.delete).toHaveBeenCalledWith(video.id);
        });
    });
});