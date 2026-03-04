import { SongsRepositoryPort } from "../ports/SongsRepositoryPort";

export class DeleteSongUseCase {
  constructor(private songsRepo: SongsRepositoryPort) {}

  async execute(id: string): Promise<void> {
    await this.songsRepo.delete(id);
  }
}
