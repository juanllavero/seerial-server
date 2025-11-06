import { refreshMovieMetadata } from "@/file-search/utils/refreshMetadata";

export class RefreshMovieMetadataUseCase {
  constructor() {}

  async execute(id: string): Promise<void> {
    refreshMovieMetadata(id);
  }
}
