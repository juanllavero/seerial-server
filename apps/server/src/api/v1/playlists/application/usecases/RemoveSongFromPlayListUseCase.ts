import { PlayListRepositoryPort } from "../ports/PlayListRepositoryPort";

export class RemoveSongFromPlayListUseCase {
  constructor(private playlistRepo: PlayListRepositoryPort) {}

  async execute(playlistId: string, songId: string): Promise<void> {
    return this.playlistRepo.removeSongFromPlaylist(playlistId, songId);
  }
}
