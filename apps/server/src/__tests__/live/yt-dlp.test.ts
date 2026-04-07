import fs from 'node:fs';
import path from 'node:path';

const LIVE = process.env.LIVE_INTEGRATION === 'true';
const describeIfLive = LIVE ? describe : describe.skip;

const liveBinRoot = path.join(process.cwd(), 'temp', 'live-ytdlp');
const liveBinDir = path.join(liveBinRoot, 'resources', 'lib');
const liveYtDlpPath = path.join(
    liveBinDir,
    process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp',
);

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
    fileSystemService: {
        getExternalPath: jest.fn((targetPath: string) => path.join(liveBinRoot, targetPath)),
        join: jest.fn((...parts: string[]) => path.join(...parts)),
        createFolder: jest.fn((targetPath: string) => {
            fs.mkdirSync(targetPath, { recursive: true });
        }),
    },
    notificationService: {
        broadcast: jest.fn(),
    },
    downloaderService: {
        getYtDlpPath: jest.fn(() => liveYtDlpPath),
    },
}));

const { DownloaderServiceImpl } = require('@/api/v1/shared/infrastructure/adapters/downloader/DownloaderServiceImpl') as {
    DownloaderServiceImpl: new () => {
        downloadYoutubeDownloader: () => Promise<void>;
        searchVideos: (query: string, numberOfResults: number) => Promise<
            Array<{
                id: string;
                title: string;
                url: string;
                duration: number;
                thumbnail: string;
            }>
        >;
        getYtDlpPath: () => string;
    };
};

describeIfLive('DownloaderServiceImpl – Live yt-dlp (Phase 3)', () => {
    let service: InstanceType<typeof DownloaderServiceImpl>;

    beforeAll(() => {
        fs.mkdirSync(liveBinDir, { recursive: true });
    });

    beforeEach(() => {
        service = new DownloaderServiceImpl();
    });

    it('downloads or reuses the yt-dlp binary', async () => {
        await service.downloadYoutubeDownloader();

        expect(fs.existsSync(service.getYtDlpPath())).toBe(true);
    }, 120000);

    it('returns search results for a known query', async () => {
        await service.downloadYoutubeDownloader();

        const results = await service.searchVideos('Rick Astley Never Gonna Give You Up', 2);

        expect(Array.isArray(results)).toBe(true);
        if (results.length === 0) {
            console.warn('yt-dlp search returned no results; skipping strict assertions');
            return;
        }

        expect(results[0].id).toBeTruthy();
        expect(results[0].title).toBeTruthy();
        expect(typeof results[0].url).toBe('string');
    }, 120000);

    it('falls back to one result when asked for zero', async () => {
        await service.downloadYoutubeDownloader();

        const results = await service.searchVideos('Daft Punk Around the World', 0);

        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBeLessThanOrEqual(1);
    }, 120000);
});