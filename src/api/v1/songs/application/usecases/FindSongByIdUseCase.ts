import { Song } from "../../domain/Song";
import { SongsRepositoryPort } from "../ports/SongsRepositoryPort";

export class FindSongByIdUseCase {
  constructor(private songsRepo: SongsRepositoryPort) {}

  async execute(path: string): Promise<Song | null> {
    return this.songsRepo.findById(path);
  }
}
