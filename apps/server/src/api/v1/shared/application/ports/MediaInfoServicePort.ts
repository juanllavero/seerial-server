import type { MediaInfoData } from "@seerial/domain";

export interface MediaInfoServicePort {
  getAudioMetadata(filePath: string): Promise<unknown>;
  getMediaChapters(filePath: string): Promise<unknown>;
  getMediaInformation(filePath: string): Promise<MediaInfoData | undefined>;
}
