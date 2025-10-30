import { Album } from "../../domain/Album";
import { AlbumsRepositoryPort } from "../ports/AlbumsRepositoryPort";

export class UpdateAlbumUseCase {
  constructor(private albumRepo: AlbumsRepositoryPort) {}

  async execute(id: string, data: Partial<Album>): Promise<Album> {
    return this.albumRepo.update(id, data);
  }
}
