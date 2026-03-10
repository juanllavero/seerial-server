import type { Song } from '../../domain/Song';

export interface SongsRepositoryPort {
  findById(id: string): Promise<Song | null>;
  findByPath(path: string): Promise<Song | null>;
  findByAlbum(albumId: string): Promise<Song[]>;
  create(album: Partial<Song>): Promise<Song | null>;
  update(id: string, album: Partial<Song>): Promise<Song>;
  delete(id: string): Promise<void>;
}
