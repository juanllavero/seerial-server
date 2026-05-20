import type { Collection } from '../../domain/Collection';
import type { CollectionSummaryDTO, ReorderItemDTO } from '../dtos/CollectionDTOs';

export interface CollectionsRepositoryPort {
  getAll(libraryId: string): Promise<Collection[]>;
  getAllSummary(): Promise<CollectionSummaryDTO[]>;
  getById(id: string): Promise<Collection | null>;
  getByName(name: string): Promise<Collection | null>;
  add(collection: Partial<Collection>): Promise<Collection | null>;
  update(id: string, data: Partial<Collection>): Promise<Collection>;
  delete(id: string): Promise<boolean>;

  // Relations - add
  addAlbum(collectionId: string, albumId: string): Promise<void>;
  addMovie(collectionId: string, movieId: string): Promise<void>;
  addSeries(collectionId: string, seriesId: string): Promise<void>;
  addLibrary(libraryId: string, collectionId: string): Promise<void>;

  // Relations - remove
  removeAlbum(collectionId: string, albumId: string): Promise<void>;
  removeMovie(collectionId: string, movieId: string): Promise<void>;
  removeSeries(collectionId: string, seriesId: string): Promise<void>;

  // Relations - check existence
  hasAlbum(collectionId: string, albumId: string): Promise<boolean>;
  hasMovie(collectionId: string, movieId: string): Promise<boolean>;
  hasSeries(collectionId: string, seriesId: string): Promise<boolean>;

  // Special operation: reorder with transaction
  reorderContent(collectionId: string, orderedItems: ReorderItemDTO[]): Promise<void>;
}
