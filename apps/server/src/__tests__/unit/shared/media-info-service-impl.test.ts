const mockMediaProbeLoggerError = jest.fn();
const mockGetAudioInfo = jest.fn();
const mockGetChapters = jest.fn();
const mockGetMediaInfo = jest.fn();

jest.mock('@/utils/logger', () => ({
  __esModule: true,
  default: {
    child: jest.fn(() => ({
      error: mockMediaProbeLoggerError,
    })),
  },
}));

jest.mock('@/api/v1/shared/infrastructure/adapters/ffmpeg/audioInfo', () => ({
  getAudioInfo: (...args: unknown[]) => mockGetAudioInfo(...args),
}));

jest.mock('@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo', () => ({
  getChapters: (...args: unknown[]) => mockGetChapters(...args),
  getMediaInfo: (...args: unknown[]) => mockGetMediaInfo(...args),
}));

import { MediaInfoServiceImpl } from '@/api/v1/shared/infrastructure/adapters/media-info/MediaInfoServiceImpl';

describe('MediaInfoServiceImpl', () => {
  let service: MediaInfoServiceImpl;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MediaInfoServiceImpl();
  });

  it('decodes paths before delegating audio metadata extraction', async () => {
    mockGetAudioInfo.mockResolvedValue({ codec: 'aac' });

    await expect(service.getAudioMetadata('C%3A%2Fmedia%2Ftrack.mp3')).resolves.toEqual({
      codec: 'aac',
    });

    expect(mockGetAudioInfo).toHaveBeenCalledWith('C:/media/track.mp3');
  });

  it('decodes paths before delegating chapter extraction', async () => {
    mockGetChapters.mockResolvedValue([{ title: 'Intro' }]);

    await expect(service.getMediaChapters('C%3A%2Fmedia%2Fmovie.mkv')).resolves.toEqual([
      { title: 'Intro' },
    ]);

    expect(mockGetChapters).toHaveBeenCalledWith('C:/media/movie.mkv');
  });

  it('decodes paths before delegating media probing', async () => {
    mockGetMediaInfo.mockResolvedValue({ mediaInfo: { file: 'movie.mkv' } });

    await expect(service.getMediaInformation('C%3A%2Fmedia%2Fmovie.mkv')).resolves.toEqual({
      mediaInfo: { file: 'movie.mkv' },
    });

    expect(mockGetMediaInfo).toHaveBeenCalledWith('C:/media/movie.mkv');
  });

  it('wraps audio metadata errors with a stable message', async () => {
    mockGetAudioInfo.mockRejectedValue(new Error('boom'));

    await expect(service.getAudioMetadata('track.mp3')).rejects.toThrow(
      'Failed to get audio metadata for track.mp3',
    );

    expect(mockMediaProbeLoggerError).toHaveBeenCalled();
  });

  it('wraps chapter extraction errors with a stable message', async () => {
    mockGetChapters.mockRejectedValue(new Error('boom'));

    await expect(service.getMediaChapters('movie.mkv')).rejects.toThrow(
      'Failed to extract chapters for movie.mkv',
    );

    expect(mockMediaProbeLoggerError).toHaveBeenCalled();
  });

  it('wraps media info errors with a stable message', async () => {
    mockGetMediaInfo.mockRejectedValue(new Error('boom'));

    await expect(service.getMediaInformation('movie.mkv')).rejects.toThrow(
      'Failed to get media info for movie.mkv',
    );

    expect(mockMediaProbeLoggerError).toHaveBeenCalled();
  });
});
