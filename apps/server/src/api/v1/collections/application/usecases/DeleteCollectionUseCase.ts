import type { CollectionsRepositoryPort } from "../ports/CollectionsRepositoryPort";

export class DeleteCollectionUseCase {
	constructor(private collectionRepo: CollectionsRepositoryPort) {}

	async execute(id: string): Promise<boolean> {
		return await this.collectionRepo.delete(id);
	}
}
