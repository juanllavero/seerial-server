import type { TMDbApiClient } from '@/api/v1/shared/infrastructure/adapters/metadata/TMDbApiClient';

export class SearchMovieMetadataUseCase {
  constructor(private readonly apiClient: TMDbApiClient) {}

  async execute(): Promise<void> {}
}
