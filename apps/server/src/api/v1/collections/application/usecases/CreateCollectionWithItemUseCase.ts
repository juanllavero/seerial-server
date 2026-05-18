import { BadRequestException, NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import type { Collection } from '../../domain/Collection';
import type { CreateCollectionWithItemDTO } from '../dtos/CollectionDTOs';
import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';

export class CreateCollectionWithItemUseCase {
    constructor(private collectionRepo: CollectionsRepositoryPort) { }

    async execute(data: CreateCollectionWithItemDTO): Promise<Collection> {
        const { movieIds, seriesIds, albumIds, ...collectionData } = data;

        const existing = await this.collectionRepo.getByName(collectionData.title);
        if (existing) {
            throw new BadRequestException(messages.errors.collection.nameExists);
        }

        const created = await this.collectionRepo.add(collectionData);
        if (!created) {
            throw new NotFoundException(messages.errors.create);
        }

        for (const movieId of movieIds ?? []) {
            await this.collectionRepo.addMovie(created.id, movieId);
        }
        for (const seriesId of seriesIds ?? []) {
            await this.collectionRepo.addSeries(created.id, seriesId);
        }
        for (const albumId of albumIds ?? []) {
            await this.collectionRepo.addAlbum(created.id, albumId);
        }

        return created;
    }
}
