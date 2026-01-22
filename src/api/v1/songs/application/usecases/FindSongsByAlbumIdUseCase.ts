import { Song } from "../../domain/Song";
import { SongsRepositoryPort } from "../ports/SongsRepositoryPort";

export class FindSongsByAlbumIdUseCase {
  constructor(private songsRepo: SongsRepositoryPort) {}

  async execute(albumId: string): Promise<Song[]> {
    return this.songsRepo.findByAlbum(albumId);
  }
}
