import type { PlayListRepositoryPort } from '../ports/PlayListRepositoryPort';

export class DeletePlayListUseCase {
  constructor(private playlistRepo: PlayListRepositoryPort) {}

  async execute(id: string): Promise<void> {
    await this.playlistRepo.delete(id);
  }
}
