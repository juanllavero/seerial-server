import { Artist } from "../../domain/Artist";
import { ArtistsRepositoryPort } from "../ports/ArtistsRepositoryPort";

export class GetArtistByIdUseCase {
  constructor(private artistRepo: ArtistsRepositoryPort) {}

  async execute(id: string): Promise<Artist | null> {
    return this.artistRepo.getById(id);
  }
}
