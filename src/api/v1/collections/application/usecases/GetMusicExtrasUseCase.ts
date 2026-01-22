import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import { MusicExtrasDTO } from "../dtos/CollectionDTOs";
import { CollectionsRepositoryPort } from "../ports/CollectionRepositoryPort";

export class GetMusicExtrasUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) {}

  async execute(collectionId: string): Promise<MusicExtrasDTO> {
    return await MediaDetailsManager.findMusicExtras(collectionId);
  }
}
