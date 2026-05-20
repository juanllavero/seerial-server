import type { Video } from '@seerial/domain';
import type { VideoRepositoryPort } from '../ports/VideosRepositoryPort';

export class FindVideoByMovieIdUseCase {
  constructor(private videoRepo: VideoRepositoryPort) {}

  async execute(id: string): Promise<Video[]> {
    return this.videoRepo.findByMovieId(id);
  }
}
