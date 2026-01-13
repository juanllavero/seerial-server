import { Album } from "@/api/v0/albums/domain/Album";
import { AlbumRepositoryPort } from "../ports/PlayListRepositoryPort";

export class UpdateAlbumUseCase {
  constructor(private albumRepo: AlbumRepositoryPort) {}

  async execute(id: string, data: Partial<Album>): Promise<Album> {
    return this.albumRepo.update(id, data);
  }
}
