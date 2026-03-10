import type { Video } from '../../domain/Video';
import type { VideoRepositoryPort } from '../ports/VideosRepositoryPort';

export class FindVideoByPathUseCase {
  constructor(private videoRepo: VideoRepositoryPort) {}

  async execute(path: string): Promise<Video | null> {
    return this.videoRepo.findByPath(path);
  }
}
