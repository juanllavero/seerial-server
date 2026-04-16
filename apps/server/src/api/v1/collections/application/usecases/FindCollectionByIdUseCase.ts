import type { Collection } from "../../domain/Collection";
import type { CollectionsRepositoryPort } from "../ports/CollectionsRepositoryPort";

export class FindCollectionByIdUseCase {
	constructor(private collectionRepo: CollectionsRepositoryPort) {}

	async execute(id: string): Promise<Collection | null> {
		return await this.collectionRepo.getById(id);
	}
}
