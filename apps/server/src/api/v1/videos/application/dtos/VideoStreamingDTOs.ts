export interface StreamUrlDTO {
  filePath: string;
  start?: number;
  audio?: number;
  quality?: string;
  bitrate?: number;
  expiresIn?: number | string;
}

export interface VideoUrlDTO {
  filePath: string;
  expiresIn?: number | string;
}
