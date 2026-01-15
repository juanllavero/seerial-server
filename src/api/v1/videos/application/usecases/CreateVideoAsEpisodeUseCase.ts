import { Video } from "../../domain/Video";
import { VideoRepositoryPort } from "../ports/VideosRepositoryPort";

export class CreateVideoAsEpisodeUseCase {
  constructor(private videoRepo: VideoRepositoryPort) {}

  async execute(id: string, data: Partial<Video>): Promise<Video | null> {
    return this.videoRepo.addAsEpisode(id, data);
  }
}
