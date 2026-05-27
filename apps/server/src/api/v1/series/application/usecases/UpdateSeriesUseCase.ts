import path from 'node:path';
import type { Series } from '../../domain/Series';
import type { SeriesRepositoryPort } from '../ports/SeriesRepositoryPort';
import { downloadImage, isRemoteUrl } from '@/utils/downloadImage';

const IMAGE_FIELDS = [
  { field: 'coverSrc', fileName: 'poster' },
  { field: 'logoSrc', fileName: 'logo' },
] as const;

export class UpdateSeriesUseCase {
  constructor(private seriesRepo: SeriesRepositoryPort) { }

  async execute(id: string, data: Partial<Series>): Promise<Series> {
    const series = await this.seriesRepo.findById(id, 'few');
    if (series?.folder) {
      const mediaFolder = path.join(series.folder, 'media');
      for (const { field, fileName } of IMAGE_FIELDS) {
        const value = data[field as keyof Partial<Series>] as string | undefined;
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
    }
    return this.seriesRepo.update(id, data);
  }
}
