const mockLoggerError = jest.fn();
const mockLoggerInfo = jest.fn();
const mockExecuteFfprobe = jest.fn();
const mockExecuteFfprobeRaw = jest.fn();

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: {
    error: mockLoggerError,
    info: mockLoggerInfo,
  },
}));

jest.mock('@/api/v1/shared/infrastructure/adapters/ffmpeg/nativeFfmpeg', () => ({
  executeFfprobe: (...args: unknown[]) => mockExecuteFfprobe(...args),
  executeFfprobeRaw: (...args: unknown[]) => mockExecuteFfprobeRaw(...args),
}));

import {
  getChapters,
  getMediaInfo,
  getOnlyRuntime,
} from '@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo';

describe('mediaInfo adapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 0 from getOnlyRuntime when the path is invalid', async () => {
    await expect(getOnlyRuntime('')).resolves.toBe(0);

    expect(mockLoggerError).toHaveBeenCalledWith(
      'getOnlyRuntime: Invalid media file path provided.',
    );
  });

  it('returns media runtime in minutes when ffprobe exposes a numeric duration', async () => {
    mockExecuteFfprobe.mockResolvedValue({ format: { duration: 150 } });

    await expect(getOnlyRuntime('C:/videos/movie.mkv')).resolves.toBe(2.5);
  });

  it('returns 0 when runtime data is missing or ffprobe fails', async () => {
    mockExecuteFfprobe
      .mockResolvedValueOnce({ format: {} })
      .mockRejectedValueOnce(new Error('boom'));

    await expect(getOnlyRuntime('C:/videos/no-duration.mkv')).resolves.toBe(0);
    await expect(getOnlyRuntime('C:/videos/error.mkv')).resolves.toBe(0);
  });

  it('returns undefined and logs when getMediaInfo receives an empty path', async () => {
    await expect(getMediaInfo('')).resolves.toBeUndefined();

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Video file does not exist or path is empty',
        videoPath: '',
      }),
    );
  });

  it('builds normalized media information and skips chapter extraction when requested', async () => {
    mockExecuteFfprobe.mockResolvedValue({
      format: {
        size: 512 * 1024 * 1024,
        bit_rate: 3_200_000,
        duration: 3661,
      },
      streams: [
        {
          codec_type: 'video',
          index: 0,
          codec_name: 'h264',
          width: '1920',
          height: '1080',
          avg_frame_rate: '24000/1001',
          profile: 'High',
        },
        {
          codec_type: 'audio',
          index: 1,
          codec_name: 'aac',
          channels: 2,
          tags: { language: 'en' },
        },
        {
          codec_type: 'subtitle',
          index: 2,
          codec_name: 'subrip',
          disposition: { forced: 1 },
          tags: { title: 'English SDH' },
        },
      ],
    });

    const result = await getMediaInfo('C:/videos/movie.mkv', false);

    expect(result).toBeDefined();
    expect(result?.mediaInfo).toMatchObject({
      file: 'movie.mkv',
      location: 'C:/videos/movie.mkv',
      bitrate: '3200.00 kbps',
      duration: '01:01:01',
      size: '512.00 MB',
      container: 'MKV',
    });
    expect(result?.duration).toBeCloseTo(61.016, 2);
    expect(result?.videoTracks).toHaveLength(1);
    expect(result?.audioTracks).toHaveLength(1);
    expect(result?.subtitleTracks).toHaveLength(1);
    expect(result?.chapters).toEqual([]);
    expect(mockExecuteFfprobeRaw).not.toHaveBeenCalled();
  });

  it('extracts chapters when requested', async () => {
    mockExecuteFfprobe.mockResolvedValue({
      format: {
        duration: 120,
        size: 2 * 1024 * 1024 * 1024,
      },
      streams: [],
    });
    mockExecuteFfprobeRaw.mockResolvedValue(
      JSON.stringify({ chapters: [{ title: 'Intro', start_time: 15 }] }),
    );

    const result = await getMediaInfo('C:/videos/chapters.mkv');

    expect(result?.chapters).toEqual([
      {
        title: 'Intro',
        time: 15,
        displayTime: '00:15',
        thumbnailSrc: '',
      },
    ]);
  });

  it('rethrows probing failures from getMediaInfo after logging them', async () => {
    const error = new Error('probe failed');
    mockExecuteFfprobe.mockRejectedValue(error);

    await expect(getMediaInfo('C:/videos/broken.mkv')).rejects.toThrow('probe failed');

    expect(mockLoggerError).toHaveBeenCalledWith(error, 'Failed to get media info');
  });

  it('returns parsed chapters and logs when chapter metadata exists', async () => {
    mockExecuteFfprobeRaw.mockResolvedValue(
      JSON.stringify({
        chapters: [{ start_time: 30 }, { title: 'Finale', start_time: 95 }],
      }),
    );

    await expect(getChapters('C:/videos/chapters.mkv')).resolves.toEqual([
      {
        title: 'Sin título',
        time: 30,
        displayTime: '00:30',
        thumbnailSrc: '',
      },
      {
        title: 'Finale',
        time: 95,
        displayTime: '01:35',
        thumbnailSrc: '',
      },
    ]);

    expect(mockLoggerInfo).toHaveBeenCalledWith({
      message: 'Chapters extracted',
      chapterCount: 2,
    });
  });

  it('logs when no chapters are present and returns an empty array', async () => {
    mockExecuteFfprobeRaw.mockResolvedValue(JSON.stringify({ chapters: [] }));

    await expect(getChapters('C:/videos/no-chapters.mkv')).resolves.toEqual([]);

    expect(mockLoggerInfo).toHaveBeenCalledWith({
      message: 'No chapters found in the file',
      file: 'C:/videos/no-chapters.mkv',
    });
  });

  it('swallows chapter extraction errors and returns an empty array', async () => {
    const error = new Error('invalid json');
    mockExecuteFfprobeRaw.mockRejectedValue(error);

    await expect(getChapters('C:/videos/broken-chapters.mkv')).resolves.toEqual([]);

    expect(mockLoggerError).toHaveBeenCalledWith({
      err: error,
      message: 'Error getting chapters',
      file: 'C:/videos/broken-chapters.mkv',
    });
  });
});
