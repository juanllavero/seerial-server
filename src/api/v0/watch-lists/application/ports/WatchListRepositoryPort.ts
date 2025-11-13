import { WatchList } from "../../domain/WatchList";

export interface WatchListRepositoryPort {
  findByVideoId(videoId: string): Promise<WatchList | null>;
  findById(id: string): Promise<WatchList | null>;
  create(album: WatchList): Promise<WatchList>;
  update(id: string, album: Partial<WatchList>): Promise<WatchList>;
  delete(id: string): Promise<void>;
  addSeries(id: string, seriesId: string): Promise<void>;
  removeSeries(id: number, seriesId: number): Promise<boolean>;
  addSeason(id: string, seasonId: string): Promise<void>;
  removeSeason(id: number, seasonId: number): Promise<boolean>;
  addEpisode(id: string, episodeId: string): Promise<void>;
  removeEpisode(id: number, episodeId: number): Promise<boolean>;
  addMovie(id: string, movieId: string): Promise<void>;
  removeMovie(id: number, movieId: number): Promise<boolean>;
  addVideo(id: string, videoId: string): Promise<void>;
  removeVideo(id: number, videoId: number): Promise<boolean>;
}
