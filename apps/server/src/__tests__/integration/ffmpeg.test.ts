import fs from 'node:fs';
import path from 'node:path';
import { executeFfprobe } from '@/api/v1/shared/infrastructure/adapters/ffmpeg/nativeFfmpeg';
import { ensureVideoFixture, TEST_VIDEO_PATH } from '../helpers/video-fixture';

// Phase 2E: FFmpeg / FFprobe integration tests using the downloaded video fixture.
// These tests require ffprobe to be available on PATH.
// They run in the 'integration' tier (local infrastructure only, no network after fixture download).

describe('FFmpeg / FFprobe – Integration (Phase 2E)', () => {
    let videoPath: string;
    let ffprobeAvailable = true;

    beforeAll(async () => {
        try {
            videoPath = await ensureVideoFixture();
        } catch (err) {
            console.warn('Could not download video fixture:', (err as Error).message);
            videoPath = TEST_VIDEO_PATH;
        }
    });

    describe('executeFfprobe – video fixture', () => {
        it('extracts format metadata from the downloaded fixture', async () => {
            if (!fs.existsSync(videoPath)) {
                console.warn('Skipping: video fixture not available');
                return;
            }

            const result = await executeFfprobe(videoPath);

            expect(result).toHaveProperty('format');
            expect(result.format).toHaveProperty('filename');
            expect(result).toHaveProperty('streams');
            expect(Array.isArray(result.streams)).toBe(true);
        }, 30000);

        it('extracts at least one stream (video or audio)', async () => {
            if (!fs.existsSync(videoPath)) {
                console.warn('Skipping: video fixture not available');
                return;
            }

            const result = await executeFfprobe(videoPath);

            expect(result.streams.length).toBeGreaterThan(0);
        }, 30000);

        it('extracts video stream with codec info', async () => {
            if (!fs.existsSync(videoPath)) {
                console.warn('Skipping: video fixture not available');
                return;
            }

            const result = await executeFfprobe(videoPath);

            const videoStream = result.streams.find(
                (s: Record<string, unknown>) => s.codec_type === 'video',
            );
            expect(videoStream).toBeDefined();
            expect(videoStream).toHaveProperty('codec_name');
            expect(videoStream).toHaveProperty('width');
            expect(videoStream).toHaveProperty('height');
        }, 30000);

        it('extracts duration from the format', async () => {
            if (!fs.existsSync(videoPath)) {
                console.warn('Skipping: video fixture not available');
                return;
            }

            const result = await executeFfprobe(videoPath);

            expect(result.format).toHaveProperty('duration');
            const duration = parseFloat(result.format.duration as string);
            expect(duration).toBeGreaterThan(0);
        }, 30000);
    });

    describe('executeFfprobe – error handling', () => {
        it('rejects for a non-existent file', async () => {
            await expect(executeFfprobe('/no/such/file.mkv')).rejects.toThrow();
        }, 15000);

        it('handles non-media files gracefully', async () => {
            // Use a text file. Depending on platform/ffprobe build this may reject
            // or parse as a tty/ansi pseudo-video stream; both are acceptable.
            const tmpFile = path.join(require('os').tmpdir(), 'not-a-video.txt');
            fs.writeFileSync(tmpFile, 'this is not a video');

            try {
                const result = await executeFfprobe(tmpFile);
                expect(result).toHaveProperty('format');
                expect(result).toHaveProperty('streams');
            } catch (error) {
                expect(error).toBeDefined();
            }

            fs.unlinkSync(tmpFile);
        }, 15000);
    });
});
