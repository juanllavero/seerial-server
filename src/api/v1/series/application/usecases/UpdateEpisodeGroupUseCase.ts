import { changeIdentificationShow } from "@/file-search/utils/changeIdentification";

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
