export type StemSeparationJobStatus = 'queued' | 'started' | 'processing' | 'completed' | 'error';

export interface StemSeparationJob {
  jobId: string;
  songId: string;
  inputPath: string;
  instrumentalPath: string;
  vocalsPath: string;
  status: StemSeparationJobStatus;
  message?: string;
  progress?: number;
}

export interface AudioProcessingServicePort {
  getStreamableAudioPath(originalPath: string, isWeb: boolean): Promise<string>;
  streamFile(filePath: string, req: unknown, res: unknown): void;
  ensureStemSeparationAvailable(): Promise<void>;
  queueStemSeparation(songId: string, audioPath: string): Promise<StemSeparationJob>;
}
