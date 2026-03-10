import type { Movie } from '../../movies/domain/Movie';
import type { Series } from '../../series/domain/Series';
import type { Video } from '../../videos/domain/Video';

export interface ContinueWatching {
  id: string;
  userId: string;
  seriesId?: string;
  series?: Series;
  movieId?: string;
  movie?: Movie;
  videoId: string;
  video: Video;
}
