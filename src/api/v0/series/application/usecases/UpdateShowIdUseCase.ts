import { changeIdentificationShow } from "@/file-search/utils/changeIdentification";

export class UpdateShowIdUseCase {
  constructor() {}

  async execute(id: string, themdbId: number): Promise<void> {
    changeIdentificationShow(id, themdbId);
  }
}
