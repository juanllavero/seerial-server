import { MediaDetailsService } from '@/api/v1/shared/infrastructure/services/MediaDetailsService';
import type { MusicExtrasDTO } from '../dtos/CollectionDTOs';

export class GetMusicExtrasUseCase {
  async execute(collectionId: string): Promise<MusicExtrasDTO> {
    return await MediaDetailsService.findMusicExtras(collectionId);
  }
}
