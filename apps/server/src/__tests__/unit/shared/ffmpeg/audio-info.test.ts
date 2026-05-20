const mockLoggerError = jest.fn();
const mockExecuteFfprobe = jest.fn();

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: {
    error: mockLoggerError,
  },
}));

jest.mock('@/api/v1/shared/infrastructure/adapters/ffmpeg/nativeFfmpeg', () => ({
  executeFfprobe: (...args: unknown[]) => mockExecuteFfprobe(...args),
}));

import { getAudioInfo } from '@/api/v1/shared/infrastructure/adapters/ffmpeg/audioInfo';

describe('getAudioInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns undefined and logs when the path is empty', async () => {
    await expect(getAudioInfo('')).resolves.toBeUndefined();

    expect(mockLoggerError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Audio file does not exist or path is empty',
        audioPath: '',
      }),
    );
  });

  it('extracts metadata from ffprobe output with lowercase and uppercase tags', async () => {
    mockExecuteFfprobe.mockResolvedValue({
      format: {
        duration: 180,
        tags: {
          album_artist: 'Album Artist',
          ALBUM: 'Album Name',
          DATE: '2024',
          GENRE: 'Rock, Pop',
          TITLE: 'Song Name',
          disc: '2/3',
          TRACK: '7/12',
          COMPOSER: 'Composer A, Composer B',
          ARTIST: 'Artist A, Artist B',
        },
      },
      streams: [{ codec_type: 'audio', codec_name: 'flac' }],
    });

    await expect(getAudioInfo('C:/music/song.flac')).resolves.toEqual({
      codec: 'flac',
      duration: 3,
      artist: 'Album Artist',
      album: 'Album Name',
      date: '2024',
      genres: ['Rock', 'Pop'],
      title: 'Song Name',
      discNumber: 2,
      trackNumber: 7,
      composers: ['Composer A', 'Composer B'],
      artists: ['Artist A', 'Artist B'],
    });
  });

  it('falls back to unknown codec and empty collections when metadata is sparse', async () => {
    mockExecuteFfprobe.mockResolvedValue({
      format: {
        tags: {},
      },
      streams: [],
    });

    await expect(getAudioInfo('C:/music/minimal.mp3')).resolves.toEqual({
      codec: 'unknown',
      duration: 0,
      artist: '',
      album: '',
      date: '',
      genres: [],
      title: '',
      discNumber: 0,
      trackNumber: 0,
      composers: [],
      artists: [],
    });
  });

  it('returns undefined when ffprobe throws', async () => {
    const error = new Error('ffprobe failed');
    mockExecuteFfprobe.mockRejectedValue(error);

    await expect(getAudioInfo('C:/music/broken.mp3')).resolves.toBeUndefined();

    expect(mockLoggerError).toHaveBeenCalledWith({
      err: error,
      message: 'Failed to get media info',
    });
  });
});
