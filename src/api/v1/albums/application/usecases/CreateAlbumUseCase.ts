import { Album } from "../../domain/Album";
import { AlbumsRepositoryPort } from "../ports/AlbumsRepositoryPort";

export class CreateAlbumUseCase {
  constructor(private albumRepo: AlbumsRepositoryPort) {}

  async execute(data: Partial<Album>): Promise<Album> {
    return this.albumRepo.create(data);
  }
}
