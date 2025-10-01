import { getAudioInfo } from "@/ffmpeg/audioInfo";
import { getChapters, getMediaInfo } from "@/ffmpeg/mediaInfo";
import ApiError from "@/utils/ApiError";

export class MediaProbeManager {
  /**
   * Gets audio-specific metadata from a media file using ffprobe.
   * @param filePath - The absolute path to the media file.
   * @returns A promise that resolves to the audio metadata.
   */
  public static async getAudioMetadata(filePath: string) {
    try {
      return await getAudioInfo(decodeURIComponent(filePath));
    } catch (error: any) {
      console.error(
        `FFprobe error for audio metadata on ${filePath}:`,
        error.message
      );
      throw new ApiError(500, `Failed to get audio metadata: ${error.message}`);
    }
  }

  /**
   * Extracts chapter markers from a media file.
   * @param filePath - The absolute path to the media file.
   * @returns A promise that resolves to the chapter data.
   */
  public static async getMediaChapters(filePath: string) {
    try {
      return await getChapters(decodeURIComponent(filePath));
    } catch (error: any) {
      console.error(
        `FFprobe error for chapters on ${filePath}:`,
        error.message
      );
      throw new ApiError(500, `Failed to extract chapters: ${error.message}`);
    }
  }

  /**
   * Gets general media information (streams, format, etc.) from a file.
   * @param filePath - The absolute path to the media file.
   * @returns A promise that resolves to the media info.
   */
  public static async getMediaInformation(filePath: string) {
    try {
      return await getMediaInfo(decodeURIComponent(filePath));
    } catch (error: any) {
      console.error(
        `FFprobe error for media info on ${filePath}:`,
        error.message
      );
      throw new ApiError(500, `Failed to get media info: ${error.message}`);
    }
  }
}
