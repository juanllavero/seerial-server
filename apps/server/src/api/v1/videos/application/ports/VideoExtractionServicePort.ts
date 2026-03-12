import type { Response as ExpressResponse } from 'express';

export interface VideoExtractionServicePort {
  streamVideoThumbnail(videoUrl: string, time: string, res: ExpressResponse): Promise<void>;
  streamVideoSubtitles(
    videoPath: string,
    trackId: number,
    startTime: number,
    res: ExpressResponse,
  ): Promise<void>;
}
