import { ConflictException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { messages } from "@/config/messages";
import type { CollectionsRepositoryPort } from "../ports/CollectionsRepositoryPort";

export class RemoveMovieFromCollectionUseCase {
    constructor(private collectionRepo: CollectionsRepositoryPort) { }

    async execute(collectionId: string, movieId: string): Promise<void> {
        const exists = await this.collectionRepo.hasMovie(collectionId, movieId);
        if (!exists) {
            throw new ConflictException(messages.errors.conflict.itemNotInCollection);
        }

        await this.collectionRepo.removeMovie(collectionId, movieId);
    }
}
