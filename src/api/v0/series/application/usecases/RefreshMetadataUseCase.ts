import { refreshSeriesMetadata } from "@/file-search/utils/refreshMetadata";

export class RefreshMetadataUseCase {
  constructor() {}

  async execute(id: string): Promise<void> {
    refreshSeriesMetadata(id);
  }
}
