import { EventEmitter } from 'node:events';
import fs from 'node:fs';

const spawnMock = jest.fn();
const spawnSyncMock = jest.fn();

jest.mock('node:child_process', () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
  spawnSync: (...args: unknown[]) => spawnSyncMock(...args),
}));

jest.mock('@/api/v1/shared/infrastructure/adapters/di/container', () => ({
  fileSystemService: {
    resourcesPath: '/resources',
    isFile: jest.fn(),
    deleteFile: jest.fn(),
  },
  notificationService: {
    broadcast: jest.fn(),
  },
}));

import { AudioProcessingServiceImpl } from '@/api/v1/songs/infrastructure/services/AudioProcessingServiceImpl';

const container = jest.requireMock('@/api/v1/shared/infrastructure/adapters/di/container');

describe('AudioProcessingServiceImpl stem separation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, 'existsSync').mockImplementation((filePath: fs.PathLike) => {
      return filePath === '/resources/cache/audio';
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('throws a controlled error when audio-separator is unavailable', async () => {
    spawnSyncMock.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: 'not recognized',
    });

    const service = new AudioProcessingServiceImpl();

    await expect(service.ensureStemSeparationAvailable()).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('queues stem separation and broadcasts live updates', async () => {
    spawnSyncMock.mockReturnValue({ status: 0, stdout: '0.44.1', stderr: '' });
    container.fileSystemService.isFile
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);

    const processEmitter = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };
    processEmitter.stdout = new EventEmitter();
    processEmitter.stderr = new EventEmitter();
    spawnMock.mockReturnValue(processEmitter);

    const service = new AudioProcessingServiceImpl();

    const job = await service.queueStemSeparation('song-1', '/music/songExample.flac');

    processEmitter.stdout.emit('data', Buffer.from('15.5% loading model'));
    processEmitter.stderr.emit('data', Buffer.from('warning line'));
    processEmitter.emit('close', 0);

    expect(job.instrumentalPath).toBe('/music/songExample.inst.flac');
    expect(job.vocalsPath).toBe('/music/songExample.vocals.flac');
    expect(container.fileSystemService.deleteFile).toHaveBeenCalledWith(
      '/music/songExample.inst.flac',
    );
    expect(container.fileSystemService.deleteFile).toHaveBeenCalledWith(
      '/music/songExample.vocals.flac',
    );
    expect(spawnMock).toHaveBeenCalledWith(
      'audio-separator',
      expect.arrayContaining([
        '/music/songExample.flac',
        '--output_dir',
        '/music',
        '--output_format',
        'FLAC',
      ]),
      { shell: true },
    );
    expect(container.notificationService.broadcast).toHaveBeenCalledWith(
      expect.stringContaining('SONG_STEM_SEPARATION_STATUS'),
    );
    expect(container.notificationService.broadcast).toHaveBeenCalledWith(
      expect.stringContaining('completed'),
    );
  });
});
