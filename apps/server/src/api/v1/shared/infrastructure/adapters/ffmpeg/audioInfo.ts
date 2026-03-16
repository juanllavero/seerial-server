import type { AudioInfo } from '@seerial/domain';
import logger from '@/utils/logger';
import { executeFfprobe } from './nativeFfmpeg';

export async function getAudioInfo(audioPath: string): Promise<AudioInfo | undefined> {
  if (!audioPath || audioPath === '') {
    logger.error({
      message: 'Audio file does not exist or path is empty',
      audioPath,
    });
    return undefined;
  }

  try {
    const data = (await executeFfprobe(audioPath)) as {
      format: { duration?: number; tags?: Record<string, string> };
      streams: Array<{ codec_type?: string; codec_name?: string }>;
    };
    const format = data.format;
    const tags = format.tags || {};
    const streams = data.streams as Array<{ codec_type?: string; codec_name?: string }>;

    const codec = streams.find((s) => s.codec_type === 'audio')?.codec_name || 'unknown';
    const duration = format.duration ? format.duration / 60 : 0;
    const artist = tags.album_artist || tags.artist || tags.ARTIST || '';
    const album = tags.album || tags.ALBUM || '';
    const date = tags.date || tags.DATE || tags.TYER || '';
    const genres =
      tags.genre?.split(',').map((g: string) => g.trim()) ??
      tags.GENRE?.split(',').map((g: string) => g.trim()) ??
      [];
    const title = tags.title || tags.TITLE || '';
    const discNumber = tags.disc ? Number.parseInt(tags.disc.split('/')[0], 10) : 0;
    const trackNumber = Number.parseInt((tags.track || tags.TRACK || '0').split('/')[0], 10) || 0;
    const composers =
      tags.composer?.split(',').map((c: string) => c.trim()) ??
      tags.COMPOSER?.split(',').map((c: string) => c.trim()) ??
      [];
    const artists =
      tags.artist?.split(',').map((a: string) => a.trim()) ??
      tags.ARTIST?.split(',').map((a: string) => a.trim()) ??
      [];

    return {
      codec,
      duration,
      artist,
      album,
      date,
      genres,
      title,
      discNumber,
      trackNumber,
      composers,
      artists,
    };
  } catch (err) {
    logger.error({ err, message: 'Failed to get media info' });
    return undefined;
  }
}
