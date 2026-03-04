export interface ContinueWatchingVideosDTO {
  videos: any[];
}

export interface ContinueWatchingVideo {
  id: string;
  title: string;
  subtitle?: string;
  episodeNumber?: number;
  seasonNumber?: number;
  date: string;
  duration: number;
  timeWatched: number;
  genres: string[];
  overview: string;
  backgroundImage: string;
  posterImage: string;
  logoImage: string;
  videoImage: string;
  movieId?: string;
  episodeId?: string;
  videoId: string;
}
