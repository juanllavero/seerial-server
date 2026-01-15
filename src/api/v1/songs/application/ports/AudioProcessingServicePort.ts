export interface AudioProcessingServicePort {
  getStreamableAudioPath(originalPath: string, isWeb: boolean): Promise<string>;
  streamFile(filePath: string, req: any, res: any): void;
}
