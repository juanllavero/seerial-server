import { ApiResponse } from "@/api/v0/shared/application/dtos/DTOs";

export interface UpdateVideoDTO {
  title?: string;
  fileSrc?: string;
  runtime?: number;
  imgSrc?: string;
  imgUrls?: string[];
  selectedAudioTrack?: number;
  selectedSubtitleTrack?: number;
  extraType?: string;
  episodeId?: string;
  movieId?: string;
}

export interface SetWatchStateDTO {
  watched: boolean;
  userId: string;
}

export interface VideoResponse extends ApiResponse {}
