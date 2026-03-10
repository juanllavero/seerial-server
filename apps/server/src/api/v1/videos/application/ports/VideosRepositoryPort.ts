import type { Video } from '../../domain/Video';

export interface VideoRepositoryPort {
  findById(id: string, includeSongs?: boolean): Promise<Video | null>;
  findByEpisodeId(episodeId: string): Promise<Video | null>;
  findByMovieId(movieId: string): Promise<Video[]>;
  findByExtraId(extraId: string): Promise<Video | null>;
  findByPath(path: string): Promise<Video | null>;
  create(video: Video): Promise<Video>;
  update(id: string, video: Partial<Video>): Promise<Video>;
  delete(id: string): Promise<void>;
  addAsMovie(movieId: string, video?: Partial<Video>): Promise<Video | null>;
  addAsMovieExtra(movieId: string, video?: Partial<Video>): Promise<Video | null>;
  addAsEpisode(episodeId: string, video?: Partial<Video>): Promise<Video | null>;
}
