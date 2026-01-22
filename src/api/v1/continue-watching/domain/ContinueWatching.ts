import { Movie } from "../../movies/domain/Movie";
import { Series } from "../../series/domain/Series";
import { Video } from "../../videos/domain/Video";

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
