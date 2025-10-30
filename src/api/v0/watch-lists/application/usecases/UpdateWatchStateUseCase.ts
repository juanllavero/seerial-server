import { Album } from "../../domain/Album";
import { AlbumRepositoryPort } from "../ports/AlbumRepositoryPort";

export class UpdateWatchStateUseCase {
  constructor(private albumRepo: AlbumRepositoryPort) {}

  async execute(id: string, data: Partial<Album>): Promise<Album> {
    return this.albumRepo.update(id, data);
  }
}
