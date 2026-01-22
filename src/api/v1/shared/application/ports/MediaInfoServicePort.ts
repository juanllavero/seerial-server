export interface MediaInfoServicePort {
  getAudioMetadata(filePath: string): Promise<any>;
  getMediaChapters(filePath: string): Promise<any>;
  getMediaInformation(filePath: string): Promise<any>;
}
