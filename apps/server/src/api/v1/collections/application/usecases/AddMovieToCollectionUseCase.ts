import { ConflictException } from "@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions";
import { messages } from "@/config/messages";
import type { CollectionsRepositoryPort } from "../ports/CollectionsRepositoryPort";

export class AddMovieToCollectionUseCase {
    constructor(private collectionRepo: CollectionsRepositoryPort) { }

    async execute(collectionId: string, movieId: string): Promise<void> {
        const alreadyExists = await this.collectionRepo.hasMovie(collectionId, movieId);
        if (alreadyExists) {
            throw new ConflictException(messages.errors.conflict.itemAlreadyInCollection);
        }

        await this.collectionRepo.addMovie(collectionId, movieId);
    }
}
