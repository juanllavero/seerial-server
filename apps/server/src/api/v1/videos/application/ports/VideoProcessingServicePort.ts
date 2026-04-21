import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';

export interface TranscodeVideoParams {
  path: string;
  start: string | number;
  audio: string | number;
  quality: string | number;
  bitrate: number;
}

export interface VideoProcessingServicePort {
  transcodeAndStreamVideo(params: TranscodeVideoParams, res: ExpressResponse): void;
  streamDirectVideoFile(req: ExpressRequest, res: ExpressResponse): void;
}
