import { ArtistsRepositoryPort } from "../ports/ArtistsRepositoryPort";

export class DeleteArtistUseCase {
  constructor(private artistRepo: ArtistsRepositoryPort) {}

  async execute(id: string): Promise<void> {
    await this.artistRepo.delete(id);
  }
}
