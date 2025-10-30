import { MediaDetailsManager } from "@/managers/MediaDetailsManager";
import { MusicExtrasDTO } from "../dtos/CollectionDTOs";
import { CollectionRepositoryPort } from "../ports/CollectionRepositoryPort";

export class GetMusicExtrasUseCase {
  constructor(private collectionRepo: CollectionRepositoryPort) {}

  async execute(collectionId: string): Promise<MusicExtrasDTO> {
    return await MediaDetailsManager.findMusicExtras(collectionId);
  }
}
