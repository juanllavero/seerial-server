import { Song } from "../../domain/Song";

export interface SongsRepositoryPort {
  findById(id: string): Promise<Song | null>;
  findByPath(path: string): Promise<Song | null>;
  create(album: Song): Promise<Song | null>;
  update(id: string, album: Partial<Song>): Promise<Song>;
  delete(id: string): Promise<void>;
}
