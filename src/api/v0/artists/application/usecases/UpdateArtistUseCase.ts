import { Artist } from "../../domain/Artist";
import { ArtistRepositoryPort } from "../ports/ArtistsRepositoryPort";

export class UpdateArtistUseCase {
  constructor(private artistRepo: ArtistRepositoryPort) {}

  async execute(id: string, data: Partial<Artist>): Promise<Artist> {
    return this.artistRepo.update(id, data);
  }
}
