import { ArtistRepositoryPort } from "../ports/ArtistsRepositoryPort";

export class DeleteArtistUseCase {
  constructor(private artistRepo: ArtistRepositoryPort) {}

  async execute(id: string): Promise<void> {
    await this.artistRepo.delete(id);
  }
}
