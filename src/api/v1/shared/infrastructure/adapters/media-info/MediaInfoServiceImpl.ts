import ApiError from "@/data/ApiError";
import { getAudioInfo } from "@/ffmpeg/audioInfo";
import { getChapters, getMediaInfo } from "@/ffmpeg/mediaInfo";
import { MediaInfoServicePort } from "../../../application/ports/MediaInfoServicePort";

export class MediaInfoServiceImpl implements MediaInfoServicePort {
  constructor() {}

  /**
   * Gets audio-specific metadata from a media file using ffprobe.
   * @param filePath - The absolute path to the media file.
   * @returns A promise that resolves to the audio metadata.
   */
  getAudioMetadata(filePath: string): Promise<any> {
    try {
      return getAudioInfo(decodeURIComponent(filePath));
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
  getMediaChapters(filePath: string): Promise<any> {
    try {
      return getChapters(decodeURIComponent(filePath));
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
  getMediaInformation(filePath: string): Promise<any> {
    try {
      return getMediaInfo(decodeURIComponent(filePath));
    } catch (error: any) {
      console.error(
        `FFprobe error for media info on ${filePath}:`,
        error.message
      );
      throw new ApiError(500, `Failed to get media info: ${error.message}`);
    }
  }
}
