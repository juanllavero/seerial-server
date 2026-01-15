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

export interface SetVideoWatchStateDTO {
  watched: boolean;
  userId: string;
}

export interface VideoResponse {
  status: string;
  message: string;
  data?: any;
}
