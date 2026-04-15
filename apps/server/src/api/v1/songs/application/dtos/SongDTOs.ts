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

export interface LyricsResponse {
  message: string;
  path: string;
}

export interface SongUrlDTO {
  filePath: string;
  localId?: string;
  expiresIn?: number | string;
}

export interface SeparateSongStemsResponseDTO {
  jobId: string;
  songId: string;
  inputPath: string;
  instrumentalPath: string;
  vocalsPath: string;
  status: 'queued' | 'started' | 'processing' | 'completed' | 'error';
  message?: string;
  progress?: number;
}

export interface LyricsDTO {
  language: string;
  type: 'original' | 'transcription' | 'translation';
  format: 'lrc' | 'ttml';
  content: string;
}