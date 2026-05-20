import type { PlayListRepositoryPort } from '../ports/PlayListRepositoryPort';

export class AddSongToPlayListUseCase {
  constructor(private playlistRepo: PlayListRepositoryPort) {}

  async execute(playlistId: string, songId: string): Promise<void> {
    return this.playlistRepo.addSongToPlaylist(playlistId, songId);
  }
}
