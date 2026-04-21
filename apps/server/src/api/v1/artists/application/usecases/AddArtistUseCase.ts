import type { Artist } from '../../domain/Artist';
import type { ArtistsRepositoryPort } from '../ports/ArtistsRepositoryPort';

export class AddArtistUseCase {
  constructor(private artistRepo: ArtistsRepositoryPort) {}

  async execute(artist: Partial<Artist>): Promise<Artist | null> {
    return this.artistRepo.add(artist);
  }
}
