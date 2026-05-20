import type { Video } from '@seerial/domain';
import type { VideoRepositoryPort } from '../ports/VideosRepositoryPort';

export class UpdateVideoUseCase {
  constructor(private videoRepo: VideoRepositoryPort) {}

  async execute(id: string, data: Partial<Video>): Promise<Video> {
    return this.videoRepo.update(id, data);
  }
}
