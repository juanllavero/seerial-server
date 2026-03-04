import { MediaDetailsService } from "@/api/v1/shared/infrastructure/services/MediaDetailsService";
import { MusicExtrasDTO } from "../dtos/CollectionDTOs";

export class GetMusicExtrasUseCase {
  constructor() {}

  async execute(collectionId: string): Promise<MusicExtrasDTO> {
    return await MediaDetailsService.findMusicExtras(collectionId);
  }
}
