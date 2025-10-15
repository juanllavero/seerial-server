import { EpisodeData } from "@/api/v0/episodes/episodes.types";
import { MovieData } from "@/api/v0/movies/movies.types";
import { VideoData } from "@/api/v0/videos/videos.types";

export interface WatchListData {
  id: string;
  userId: string;
  seriesId?: string;
  seasonId?: string;
  episodeId?: string;
  episode?: EpisodeData;
  movieId?: string;
  movie?: MovieData;
  videoId?: string;
  video?: VideoData;
  timeWatched: number;
  lastWatched: string;
}
