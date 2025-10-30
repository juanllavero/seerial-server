import { Album } from "../../domain/Album";

export interface AlbumsRepositoryPort {
  findAll(libraryId: string): Promise<Album[]>;
  findById(id: string, includeSongs?: boolean): Promise<Album | null>;
  create(album: Album): Promise<Album>;
  update(id: string, album: Partial<Album>): Promise<Album>;
  delete(id: string): Promise<void>;
}
