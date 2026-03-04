import { ContinueWatchingVideo } from "../dtos/ContinueWatchingDTOs";

export interface ContinueWatchingRepositoryPort {
  getVideos(userId: string): Promise<ContinueWatchingVideo[]>;
  getCurrentEpisode(seriesId: string): Promise<any>;
  add(
    videoId: string,
    userId: string,
    seriesId?: string,
    movieId?: string
  ): Promise<any>;
  delete(videoId: string, userId?: string): Promise<void>;
  deleteAll(
    userId: string,
    seriesId?: string,
    movieId?: string
  ): Promise<boolean>;
}
