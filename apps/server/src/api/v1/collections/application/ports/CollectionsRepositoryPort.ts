import type { Collection } from "../../domain/Collection";
import type { ReorderItemDTO } from "../dtos/CollectionDTOs";

export interface CollectionsRepositoryPort {
	getAll(libraryId: string): Promise<Collection[]>;
	getById(id: string): Promise<Collection | null>;
	getByName(name: string): Promise<Collection | null>;
	add(collection: Partial<Collection>): Promise<Collection | null>;
	update(id: string, data: Partial<Collection>): Promise<Collection>;
	delete(id: string): Promise<boolean>;

	// Relations
	addAlbum(collectionId: string, albumId: string): Promise<void>;
	addMovie(collectionId: string, movieId: string): Promise<void>;
	addSeries(collectionId: string, seriesId: string): Promise<void>;
	addLibrary(libraryId: string, collectionId: string): Promise<void>;

	// Special operation: reorder with transaction
	reorderContent(
		collectionId: string,
		orderedItems: ReorderItemDTO[],
	): Promise<void>;
}
