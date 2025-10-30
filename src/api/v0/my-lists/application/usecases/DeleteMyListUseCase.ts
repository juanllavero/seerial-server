import { AlbumRepositoryPort } from "../ports/AlbumRepositoryPort";

export class DeleteAlbumUseCase {
  constructor(private albumRepo: AlbumRepositoryPort) {}

  async execute(id: string): Promise<void> {
    await this.albumRepo.delete(id);
  }
}
