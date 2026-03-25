import { MediaInfoData } from '@seerial/domain';
import { getAudioInfo } from '@/api/v1/shared/infrastructure/adapters/ffmpeg/audioInfo';
import {
  getChapters,
  getMediaInfo,
} from '@/api/v1/shared/infrastructure/adapters/ffmpeg/mediaInfo';
import logger from '@/utils/logger';
import type { MediaInfoServicePort } from '../../../application/ports/MediaInfoServicePort';

const mediaProbeLogger = logger.child({ category: 'Media Probe' });

export class MediaInfoServiceImpl implements MediaInfoServicePort {
  /**
   * Gets audio-specific metadata from a media file using ffprobe.
   * @param filePath - The absolute path to the media file.
   * @returns A promise that resolves to the audio metadata.
   */
  async getAudioMetadata(filePath: string): Promise<unknown> {
    try {
      return await getAudioInfo(decodeURIComponent(filePath));
    } catch (error: unknown) {
      mediaProbeLogger.error(error, `FFprobe error for audio metadata on ${filePath}`);
      throw new Error(`Failed to get audio metadata for ${filePath}`);
    }
  }

  /**
   * Extracts chapter markers from a media file.
   * @param filePath - The absolute path to the media file.
   * @returns A promise that resolves to the chapter data.
   */
  async getMediaChapters(filePath: string): Promise<unknown> {
    try {
      return await getChapters(decodeURIComponent(filePath));
    } catch (error: unknown) {
      mediaProbeLogger.error(error, `FFprobe error for chapters on ${filePath}`);
      throw new Error(`Failed to extract chapters for ${filePath}`);
    }
  }

  /**
   * Gets general media information (streams, format, etc.) from a file.
   * @param filePath - The absolute path to the media file.
   * @returns A promise that resolves to the media info.
   */
  async getMediaInformation(filePath: string): Promise<MediaInfoData | undefined> {
    try {
      return await getMediaInfo(decodeURIComponent(filePath));
    } catch (error: unknown) {
      mediaProbeLogger.error(error, `FFprobe error for media info on ${filePath}`);
      throw new Error(`Failed to get media info for ${filePath}`);
    }
  }
}
