import { Artist, Artist as ArtistData } from "../../domain/Artist";

export interface ArtistsRepositoryPort {
  getById(id: string): Promise<Artist | null>;
  getByName(name: string): Promise<Artist | null>;
  add(artist: Partial<ArtistData>): Promise<Artist>;
  update(id: string, data: Partial<ArtistData>): Promise<Artist>;
  delete(id: string): Promise<boolean>;
}
