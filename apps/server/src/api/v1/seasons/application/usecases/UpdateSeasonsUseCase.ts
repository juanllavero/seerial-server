import path from 'node:path';
import type { Season } from '../../domain/Season';
import type { SeasonsRepositoryPort } from '../ports/SeasonsRepositoryPort';
import { seriesRepo } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { downloadImage, isRemoteUrl } from '@/utils/downloadImage';

const SEASON_IMAGE_FIELDS = [
  { field: 'backgroundSrc', fileName: 'background' },
  { field: 'videoSrc', fileName: 'video' },
  { field: 'musicSrc', fileName: 'theme' },
] as const;

async function downloadSeasonImageFields(
  data: Partial<Season>,
  seriesFolder: string,
  seasonNumber: number,
): Promise<void> {
  const mediaFolder = path.join(seriesFolder, 'media');
  const prefix = `s${seasonNumber}_`;
  for (const { field, fileName } of SEASON_IMAGE_FIELDS) {
    const value = data[field as keyof Partial<Season>] as string | undefined;
    if (value && isRemoteUrl(value)) {
      const ext = path.extname(new URL(value).pathname) || '.jpg';
      const destPath = path.join(mediaFolder, `${prefix}${fileName}${ext}`);
      try {
        await downloadImage(value, destPath);
        (data as Record<string, string>)[field] = destPath;
      } catch {
        // Keep original URL if download fails
      }
    }
  }
}

export class UpdateSeasonUseCase {
  constructor(private seasonsRepo: SeasonsRepositoryPort) {}

  async execute(id: string, data: Partial<Season>): Promise<Season> {
    const needsDownload = SEASON_IMAGE_FIELDS.some(({ field }) => {
      const value = data[field as keyof Partial<Season>] as string | undefined;
      return value && isRemoteUrl(value);
    });

    if (needsDownload) {
      const season = await this.seasonsRepo.findById(id, 'few');
      if (season) {
        const series = await seriesRepo.findById(season.seriesId, 'few');
        if (series?.folder) {
          await downloadSeasonImageFields(data, series.folder, season.seasonNumber);
        }
      }
    }

    return await this.seasonsRepo.update(id, data);
  }
}
