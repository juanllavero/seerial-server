import type { LibraryItem } from '@seerial/domain';
import type { Library } from '../../domain/Library';

export interface LibrariesRepositoryPort {
  getAll(): Promise<Library[]>;
  getContent(libraryId: string, userId: string, watched?: boolean): Promise<LibraryItem[]>;
  getById(id: string): Promise<Library | null>;
  getByAlbumId(albumId: string): Promise<Library | null>;
  getByMovieId(movieId: string): Promise<Library | null>;
  getBySeriesId(seriesId: string): Promise<Library | null>;
  getBySeasonId(seasonId: string): Promise<Library | null>;
  getByVideoId(videoId: string): Promise<Library | null>;
  reorder(orderedLibrariesIds: string[]): Promise<boolean>;
  reorderItems(libraryId: string, orderedItems: { id: string; type: string }[]): Promise<boolean>;
  create(library: Partial<Library>): Promise<Library | null>;
  update(id: string, data: Partial<Library>): Promise<Library>;
  delete(id: string): Promise<boolean>;
  addAnalyzedFolder(libraryId: string, file: string, videoId: string): Promise<Library>;
  addAnalyzedFile(libraryId: string, folder: string, videoId: string): Promise<Library>;
  removeAnalyzedFile(libraryId: string, file: string): Promise<Library>;
  removeAnalyzedFolder(libraryId: string, folder: string): Promise<Library>;
}
