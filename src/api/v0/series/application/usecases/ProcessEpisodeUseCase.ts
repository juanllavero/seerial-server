import { MediaInfoServicePort } from "@/api/v0/shared/application/ports/MediaInfoServicePort";

export class ProcessEpisodeUseCase {
  constructor(private readonly mediaInfoService: MediaInfoServicePort) {}

  async execute(): Promise<void> {}
}
