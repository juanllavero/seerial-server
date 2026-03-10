import type { WatchList } from '../../domain/WatchList';

export interface WatchListRepositoryPort {
  findByVideoId(videoId: string): Promise<WatchList | null>;
  findById(id: string): Promise<WatchList | null>;
  create(album: WatchList): Promise<WatchList>;
  update(id: string, album: Partial<WatchList>): Promise<WatchList>;
  delete(id: string): Promise<void>;
  addSeries(userId: string, seriesId: string): Promise<void>;
  removeSeries(userId: string, seriesId: string): Promise<boolean>;
  addSeason(userId: string, seasonId: string): Promise<void>;
  removeSeason(userId: string, seasonId: string): Promise<boolean>;
  addEpisode(userId: string, episodeId: string): Promise<void>;
  removeEpisode(userId: string, episodeId: string): Promise<boolean>;
  addMovie(userId: string, movieId: string): Promise<void>;
  removeMovie(userId: string, movieId: string): Promise<boolean>;
  addVideo(userId: string, videoId: string): Promise<void>;
  removeVideo(userId: string, videoId: string): Promise<boolean>;
  isVideoWatched(videoId: string, userId: string): Promise<boolean>;
  isSeriesWatched(seriesId: string, userId: string): Promise<boolean>;
  isMovieWatched(movieId: string, userId: string): Promise<boolean>;
  isSeasonWatched(seasonId: string, userId: string): Promise<boolean>;
}
