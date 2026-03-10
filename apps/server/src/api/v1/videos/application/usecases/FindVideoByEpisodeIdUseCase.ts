import type { Video } from '../../domain/Video';
import type { VideoRepositoryPort } from '../ports/VideosRepositoryPort';

export class FindVideoByEpisodeIdUseCase {
  constructor(private videoRepo: VideoRepositoryPort) {}

  async execute(id: string): Promise<Video | null> {
    return this.videoRepo.findByEpisodeId(id);
  }
}
