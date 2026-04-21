import type { AlbumsRepositoryPort } from '@/api/v1/albums/application/ports/AlbumsRepositoryPort';
import type { Album } from '@/api/v1/albums/domain/Album';
import type { MoviesRepositoryPort } from '@/api/v1/movies/application/ports/MoviesRepositoryPort';
import type { Movie } from '@/api/v1/movies/domain/Movie';
import type { SeriesRepositoryPort } from '@/api/v1/series/application/ports/SeriesRepositoryPort';
import type { Series } from '@/api/v1/series/domain/Series';
import { useCases } from '@/api/v1/shared/infrastructure/adapters/di/container';
import { NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import type { LibrariesRepositoryPort } from '../ports/LibrariesRepositoryPort';

export class DeleteLibraryUseCase {
  constructor(
    private librariesRepo: LibrariesRepositoryPort,
    private seriesRepo: SeriesRepositoryPort,
    private moviesRepo: MoviesRepositoryPort,
    private albumsRepo: AlbumsRepositoryPort,
  ) {}

  async execute(id: string): Promise<void> {
    const library = await this.librariesRepo.getById(id);

    if (!library) {
      throw new NotFoundException(messages.errors.notFound.library);
    }

    // Before deleting the library, cascade deletion through use cases
    // so local data (images, videos, thumbnails) is properly cleaned up
    const seriesList: Series[] = await this.seriesRepo.findAll(id);
    for (const series of seriesList) {
      await useCases.deleteSeries().execute(series.id);
    }

    const moviesList: Movie[] = await this.moviesRepo.findAll(id);
    for (const movie of moviesList) {
      await useCases.deleteMovie().execute(movie.id);
    }

    const albumsList: Album[] = await this.albumsRepo.findAll(id);
    for (const album of albumsList) {
      await useCases.deleteAlbum().execute(album.id || '');
    }

    await this.librariesRepo.delete(id);
  }
}
