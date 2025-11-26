import { Video } from "../../domain/Video";
import { VideoRepositoryPort } from "../ports/VideosRepositoryPort";

export class FindVideoByMovieIdUseCase {
  constructor(private videoRepo: VideoRepositoryPort) {}

  async execute(id: string): Promise<Video[]> {
    return this.videoRepo.findByMovieId(id);
  }
}
