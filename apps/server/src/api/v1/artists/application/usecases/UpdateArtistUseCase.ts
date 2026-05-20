import type { Artist } from '../../domain/Artist';
import type { ArtistsRepositoryPort } from '../ports/ArtistsRepositoryPort';

export class UpdateArtistUseCase {
  constructor(private artistRepo: ArtistsRepositoryPort) {}

  async execute(id: string, data: Partial<Artist>): Promise<Artist> {
    return this.artistRepo.update(id, data);
  }
}
