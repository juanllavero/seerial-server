import path from 'node:path';
import type { Movie } from '../../domain/Movie';
import type { MoviesRepositoryPort } from '../ports/MoviesRepositoryPort';
import { downloadImage, isRemoteUrl } from '@/utils/downloadImage';

const IMAGE_FIELDS = [
  { field: 'coverSrc', fileName: 'poster' },
  { field: 'logoSrc', fileName: 'logo' },
  { field: 'backgroundSrc', fileName: 'background' },
  { field: 'videoSrc', fileName: 'video' },
  { field: 'musicSrc', fileName: 'theme' },
] as const;

export class UpdateMovieUseCase {
  constructor(private moviesRepo: MoviesRepositoryPort) { }

  async execute(id: string, data: Partial<Movie>): Promise<Movie> {
    const movie = await this.moviesRepo.findById(id);
    if (movie?.folder) {
      const mediaFolder = path.join(movie.folder, 'media');
      for (const { field, fileName } of IMAGE_FIELDS) {
        const value = data[field as keyof Partial<Movie>] as string | undefined;
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
    return this.moviesRepo.update(id, data);
  }
}
