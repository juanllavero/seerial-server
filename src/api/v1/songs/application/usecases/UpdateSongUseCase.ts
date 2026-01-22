import { Song } from "../../domain/Song";
import { SongsRepositoryPort } from "../ports/SongsRepositoryPort";

export class UpdateSongUseCase {
  constructor(private songsRepo: SongsRepositoryPort) {}

  async execute(id: string, data: Partial<Song>): Promise<Song> {
    return this.songsRepo.update(id, data);
  }
}
