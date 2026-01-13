import { TMDbApiClient } from "@/api/v0/shared/infrastructure/adapters/metadata/TMDbApiClient";

export class SearchMovieMetadataUseCase {
  constructor(private readonly apiClient: TMDbApiClient) {}

  async execute(): Promise<void> {}
}
