import { AlbumsRepositoryPort } from "../ports/AlbumsRepositoryPort";

export class AddArtistToAlbumUseCase {
  constructor(private albumsRepo: AlbumsRepositoryPort) {}

  async execute(
    artistId: string,
    albumId: string
  ): Promise<{ id: string; artistId: string; albumId: string }> {
    return await this.albumsRepo.addArtistToAlbum(artistId, albumId);
  }
}
