export interface VideoExtractionServicePort {
  streamVideoThumbnail(videoUrl: string, time: string, res: any): Promise<void>;
  streamVideoSubtitles(
    videoPath: string,
    trackId: number,
    startTime: number,
    res: any,
  ): Promise<void>;
}
