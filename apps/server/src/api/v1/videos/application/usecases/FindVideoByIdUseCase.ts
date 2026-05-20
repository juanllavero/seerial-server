import type { Video } from '@seerial/domain';
import type { VideoRepositoryPort } from '../ports/VideosRepositoryPort';

export class FindVideoByIdUseCase {
  constructor(private videoRepo: VideoRepositoryPort) {}

  async execute(id: string): Promise<Video | null> {
    return this.videoRepo.findById(id);
  }
}
