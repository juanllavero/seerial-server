import type { PlayList } from '../../domain/PlayList';
import type { PlayListRepositoryPort } from '../ports/PlayListRepositoryPort';

export class FindPlayListByIdUseCase {
  constructor(private playlistRepo: PlayListRepositoryPort) {}

  async execute(id: string): Promise<PlayList | null> {
    return this.playlistRepo.findById(id);
  }
}
