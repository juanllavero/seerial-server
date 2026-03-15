export interface UpdateWatchStateDTO {
  videoId: string;
  timeWatched: number;
  watched: boolean;
  userId: string;
}

export interface ContinueWatchingVideoDTO {
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
