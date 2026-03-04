export interface VideoProcessingServicePort {
  transcodeAndStreamVideo(params: any, res: any): void;
  streamDirectVideoFile(req: any, res: any): void;
}
