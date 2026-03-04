import { Song } from "../../domain/Song";
import { SongsRepositoryPort } from "../ports/SongsRepositoryPort";

export class CreateSongUseCase {
  constructor(private songsRepo: SongsRepositoryPort) {}

  async execute(data: Partial<Song>): Promise<Song | null> {
    return this.songsRepo.create(data);
  }
}
