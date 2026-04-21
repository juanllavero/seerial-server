import type { MediaInfoServicePort } from '@/api/v1/shared/application/ports/MediaInfoServicePort';

export class ProcessEpisodeUseCase {
  constructor(readonly _mediaInfoService: MediaInfoServicePort) {}

  async execute(): Promise<void> {}
}
