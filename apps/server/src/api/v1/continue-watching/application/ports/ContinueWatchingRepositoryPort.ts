import type { ContinueWatching } from '../../domain/ContinueWatching';
import type { ContinueWatchingVideo } from '../dtos/ContinueWatchingDTOs';

export interface ContinueWatchingRepositoryPort {
  getVideos(userId: string): Promise<ContinueWatchingVideo[]>;
  getCurrentEpisode(seriesId: string): Promise<ContinueWatching | null>;
  add(
    videoId: string,
    userId: string,
    seriesId?: string,
    movieId?: string,
  ): Promise<ContinueWatching>;
  delete(videoId: string, userId?: string): Promise<void>;
  deleteAll(userId: string, seriesId?: string, movieId?: string): Promise<boolean>;
}
