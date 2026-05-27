import path from 'node:path';
import type { Collection } from '../../domain/Collection';
import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';
import { fileSystemService } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { downloadImage, isRemoteUrl } from '@/utils/downloadImage';

const COLLECTION_IMAGE_FIELDS = [
  { field: 'posterSrc', fileName: 'poster' },
  { field: 'backgroundSrc', fileName: 'background' },
] as const;

export class UpdateCollectionUseCase {
  constructor(private collectionRepo: CollectionsRepositoryPort) { }

  async execute(id: string, data: Partial<Collection>): Promise<Collection> {
    const mediaFolder = fileSystemService.getExternalPath(`resources/collections/${id}/media`);
    for (const { field, fileName } of COLLECTION_IMAGE_FIELDS) {
      const value = data[field as keyof Partial<Collection>] as string | undefined;
      if (value && isRemoteUrl(value)) {
        const ext = path.extname(new URL(value).pathname) || '.jpg';
        const destPath = path.join(mediaFolder, `${fileName}${ext}`);
        try {
          await downloadImage(value, destPath);
          (data as Record<string, string>)[field] = destPath;
        } catch {
          // Keep original URL if download fails
        }
      }
    }
    return this.collectionRepo.update(id, data);
  }
}
