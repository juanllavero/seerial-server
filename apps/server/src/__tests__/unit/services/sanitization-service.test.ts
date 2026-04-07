/// <reference types="jest" />

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    buildCompatiblePathCandidates,
    getSystemAllowedPaths,
    isValidFileName,
    safeJoinPath,
    sanitizeAudioPath,
    sanitizeDirectoryPath,
    sanitizeFilePath,
    sanitizeFilePathWithExtension,
    sanitizeImagePath,
    sanitizeMultipleFilePaths,
    sanitizeVideoPath,
} from '@/api/v1/shared/infrastructure/services/SanitizationService';

describe('SanitizationService', () => {
    let tmpDir: string;
    const originalPlatform = Object.getOwnPropertyDescriptor(process, 'platform');

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sanitize-test-'));
    });

    afterEach(() => {
        if (originalPlatform) {
            Object.defineProperty(process, 'platform', originalPlatform);
        }

        jest.restoreAllMocks();
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    function setProcessPlatform(platform: NodeJS.Platform) {
        Object.defineProperty(process, 'platform', {
            configurable: true,
            value: platform,
        });
    }

    it('builds compatible candidates for a valid path', () => {
        const filePath = path.join(tmpDir, 'video.mp4');
        const candidates = buildCompatiblePathCandidates(filePath);

        expect(candidates.length).toBeGreaterThan(0);
    });

    it('returns no candidates for empty normalized input', () => {
        expect(buildCompatiblePathCandidates('   ""   ')).toEqual([]);
    });

    it('builds POSIX-compatible candidates for Windows-formatted paths on unix-like systems', () => {
        setProcessPlatform('linux');

        const candidates = buildCompatiblePathCandidates('F:\\media\\movie.mkv');

        expect(candidates).toEqual(expect.arrayContaining(['/mnt/f/media/movie.mkv', '/Volumes/f/media/movie.mkv']));
    });

    it('rejects dangerous traversal patterns', () => {
        expect(() => sanitizeFilePath('../etc/passwd')).toThrow('dangerous patterns');
    });

    it('rejects invalid file path values', () => {
        expect(() => sanitizeFilePath('')).toThrow('non-empty string');
        expect(() => sanitizeFilePath(null as unknown as string)).toThrow('non-empty string');
    });

    it('enforces allowed base paths', () => {
        const target = path.join(tmpDir, 'movie.mp4');
        const sanitized = sanitizeFilePath(target, [tmpDir]);

        expect(sanitized).toContain(path.basename(target));
        expect(() => sanitizeFilePath(target, [path.join(tmpDir, 'other')])).toThrow('outside allowed directories');
    });

    it('validates extension and existing file when required', () => {
        const good = path.join(tmpDir, 'ok.mp4');
        fs.writeFileSync(good, 'content');

        expect(sanitizeFilePathWithExtension(good, ['.mp4'], [tmpDir], true)).toBeTruthy();
        expect(() => sanitizeFilePathWithExtension(good, ['.mkv'], [tmpDir], false)).toThrow('Invalid file extension');
    });

    it('rejects missing files and directory values when a file is required', () => {
        const missing = path.join(tmpDir, 'missing.mp4');
        const folder = path.join(tmpDir, 'folder.mp4');
        fs.mkdirSync(folder);

        expect(() => sanitizeFilePathWithExtension(missing, ['.mp4'], [tmpDir], true)).toThrow('File does not exist');
        expect(() => sanitizeFilePathWithExtension(folder, ['.mp4'], [tmpDir], true)).toThrow('Path is not a file');
    });

    it('sanitizes multiple file paths and validates argument type', () => {
        const f1 = path.join(tmpDir, 'a.mp4');
        const f2 = path.join(tmpDir, 'b.mp4');

        const list = sanitizeMultipleFilePaths([f1, f2], ['.mp4'], [tmpDir]);
        expect(list).toHaveLength(2);
        expect(() => sanitizeMultipleFilePaths({} as unknown as string[])).toThrow('must be an array');
    });

    it('safely joins path and rejects invalid file names', () => {
        const joined = safeJoinPath(tmpDir, 'cover.jpg');
        expect(joined).toContain('cover.jpg');

        expect(() => safeJoinPath(tmpDir, '')).toThrow('Invalid file name');
        expect(() => safeJoinPath(tmpDir, '../bad.jpg')).toThrow('contains path separators');
    });

    it('sanitizes directories and rejects missing or non-directory paths', () => {
        const filePath = path.join(tmpDir, 'track.mp3');
        fs.writeFileSync(filePath, 'audio');

        expect(sanitizeDirectoryPath(tmpDir, [tmpDir], true)).toBe(tmpDir);
        expect(() => sanitizeDirectoryPath(path.join(tmpDir, 'missing'), [tmpDir], true)).toThrow('Directory does not exist');
        expect(() => sanitizeDirectoryPath(filePath, [tmpDir], true)).toThrow('Path is not a directory');
    });

    it('validates file names correctly', () => {
        expect(isValidFileName('movie.mkv')).toBe(true);
        expect(isValidFileName('../movie.mkv')).toBe(false);
        expect(isValidFileName('.')).toBe(false);
        expect(isValidFileName('bad\0name.mkv')).toBe(false);
        expect(isValidFileName(null as unknown as string)).toBe(false);
    });

    it('sanitizes video paths with extension helper', () => {
        const video = path.join(tmpDir, 'video.mp4');
        const sanitized = sanitizeVideoPath(video, [tmpDir], false);

        expect(sanitized).toContain('video.mp4');
    });

    it('sanitizes audio and image wrapper paths', () => {
        const audio = path.join(tmpDir, 'song.mp3');
        const image = path.join(tmpDir, 'poster.jpg');

        expect(sanitizeAudioPath(audio, [tmpDir], false)).toContain('song.mp3');
        expect(sanitizeImagePath(image, [tmpDir], false)).toContain('poster.jpg');
    });

    it('always includes home dir in allowed paths', () => {
        const allowed = getSystemAllowedPaths();
        expect(allowed).toContain(os.homedir());
    });

    it('includes root and mounted volumes for unix-like systems', () => {
        const volumesRoot = '/Volumes';
        setProcessPlatform('darwin');
        jest.spyOn(os, 'platform').mockReturnValue('darwin');
        jest.spyOn(fs, 'existsSync').mockImplementation((target: fs.PathLike) => {
            if (target === volumesRoot) {
                return true;
            }

            return false;
        });
        jest.spyOn(fs, 'readdirSync').mockReturnValue(['Media', 'Archive'] as unknown as fs.Dirent[]);

        const allowed = getSystemAllowedPaths();

        expect(allowed).toContain('/');
        expect(allowed).toContain(path.join(volumesRoot, 'Media'));
        expect(allowed).toContain(path.join(volumesRoot, 'Archive'));
    });

    it('ignores volume read failures on unix-like systems', () => {
        setProcessPlatform('linux');
        jest.spyOn(os, 'platform').mockReturnValue('linux');
        jest.spyOn(fs, 'existsSync').mockImplementation((target: fs.PathLike) => target === '/Volumes');
        jest.spyOn(fs, 'readdirSync').mockImplementation(() => {
            throw new Error('permission denied');
        });

        const allowed = getSystemAllowedPaths();

        expect(allowed).toContain('/');
    });
});
