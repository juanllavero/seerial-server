import { changeIdentificationShow } from "@/api/v1/shared/infrastructure/services/FileSearchService";

export class UpdateEpisodeGroupUseCase {
  constructor() {}

  async execute(
    id: string,
    themdbId: number,
    episodeGroupId: string
  ): Promise<void> {
    changeIdentificationShow(id, themdbId, episodeGroupId);
  }
}
