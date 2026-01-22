import { Album } from "../../domain/Album";
import { AlbumsRepositoryPort } from "../ports/AlbumsRepositoryPort";

export class FindAllAlbumsUseCase {
  constructor(private albumRepo: AlbumsRepositoryPort) {}

  async execute(libraryId: string): Promise<Album[]> {
    return await this.albumRepo.findAll(libraryId);
  }
}
