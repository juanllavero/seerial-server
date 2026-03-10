import type { Episode } from '../../episodes/domain/Episode';
import type { Movie } from '../../movies/domain/Movie';
import type { Video } from '../../videos/domain/Video';

export interface WatchList {
  id: string;
  userId: string;
  seriesId?: string;
  seasonId?: string;
  episodeId?: string;
  episode?: Episode;
  movieId?: string;
  movie?: Movie;
  videoId?: string;
  video?: Video;
  timeWatched: number;
  lastWatched: string;
}
