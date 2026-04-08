import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  executeFfmpeg,
  executeFfprobe,
} from '@/api/v1/shared/infrastructure/adapters/ffmpeg/nativeFfmpeg';

const LIVE = process.env.LIVE_INTEGRATION === 'true';
const describeIfLive = LIVE ? describe : describe.skip;

describeIfLive('nativeFfmpeg - Live', () => {
  let tempDir = '';
  let outputAudioPath = '';

  beforeAll(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seerial-ffmpeg-live-'));
    outputAudioPath = path.join(tempDir, 'tone.wav');
  });

  afterAll(() => {
    if (fs.existsSync(outputAudioPath)) {
      fs.unlinkSync(outputAudioPath);
    }
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmdirSync(tempDir);
    }
  });

  it('starts ffmpeg and writes a real audio file', async () => {
    await executeFfmpeg([
      '-y',
      '-f',
      'lavfi',
      '-i',
      'sine=frequency=1000:duration=1',
      '-c:a',
      'pcm_s16le',
      outputAudioPath,
    ]);

    expect(fs.existsSync(outputAudioPath)).toBe(true);
    expect(fs.statSync(outputAudioPath).size).toBeGreaterThan(44);
  }, 30000);

  it('reads metadata from the generated file with ffprobe', async () => {
    const result = await executeFfprobe(outputAudioPath);

    expect(result).toHaveProperty('format');
    expect(result).toHaveProperty('streams');
    expect(Array.isArray(result.streams)).toBe(true);
    expect(result.streams.length).toBeGreaterThan(0);

    const audioStream = result.streams.find((stream) => stream.codec_type === 'audio');
    expect(audioStream).toBeDefined();
  }, 30000);

  it('fails for missing input files', async () => {
    await expect(executeFfprobe(path.join(tempDir, 'missing-file.mp4'))).rejects.toThrow();
  }, 15000);
});
