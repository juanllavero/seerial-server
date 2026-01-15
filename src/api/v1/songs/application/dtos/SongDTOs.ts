export interface UpdateSongDTO {
  title?: string;
  codec?: string;
  hasDolbyAtmos?: boolean;
  trackNumber?: number;
  discNumber?: number;
  artists?: string[];
  composers?: string[];
  duration?: number;
  fileSrc?: string;
}

export interface AddLyricsDTO {
  songId: string;
  language: string;
  content: string;
}

export interface SongResponse {
  status: string;
  message: string;
  data?: any;
}

export interface LyricsResponse {
  message: string;
  path: string;
}
