export interface AudioProcessingServicePort {
  getStreamableAudioPath(originalPath: string, isWeb: boolean): Promise<string>;
  streamFile(filePath: string, req: unknown, res: unknown): void;
}
