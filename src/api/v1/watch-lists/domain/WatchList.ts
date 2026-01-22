import { Episode } from "../../episodes/domain/Episode";
import { Movie } from "../../movies/domain/Movie";
import { Video } from "../../videos/domain/Video";

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
