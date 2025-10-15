import { MovieData } from "@/api/v0/movies/movies.types";
import { SeriesData } from "@/api/v0/series/series.types";
import { VideoData } from "@/api/v0/videos/videos.types";

export interface ContinueWatchingData {
  id: string;
  userId: string;
  seriesId?: string;
  series?: SeriesData;
  movieId?: string;
  movie?: MovieData;
  videoId: string;
  video: VideoData;
}
