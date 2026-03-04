import { changeIdentificationShow } from "@/api/v1/shared/infrastructure/services/FileSearchService";

export class UpdateShowIdUseCase {
  constructor() {}

  async execute(id: string, themdbId: number): Promise<void> {
    changeIdentificationShow(id, themdbId);
  }
}
