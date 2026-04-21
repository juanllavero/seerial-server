import { BadRequestException, NotFoundException } from '@/api/v1/shared/infrastructure/web/exceptions/HTTPExceptions';
import { messages } from '@/config/messages';
import type { Collection } from '../../domain/Collection';
import type { CreateCollectionWithItemDTO } from '../dtos/CollectionDTOs';
import type { CollectionsRepositoryPort } from '../ports/CollectionsRepositoryPort';

export class CreateCollectionWithItemUseCase {
    constructor(private collectionRepo: CollectionsRepositoryPort) { }

    async execute(data: CreateCollectionWithItemDTO): Promise<Collection> {
        const { movieId, seriesId, albumId, ...collectionData } = data;

        const itemIds = [movieId, seriesId, albumId].filter(Boolean);
        if (itemIds.length !== 1) {
            throw new BadRequestException(messages.errors.validation.notEnoughParams);
        }

        const created = await this.collectionRepo.add(collectionData);
        if (!created) {
            throw new NotFoundException(messages.errors.create);
        }

        if (movieId) {
            await this.collectionRepo.addMovie(created.id, movieId);
        } else if (seriesId) {
            await this.collectionRepo.addSeries(created.id, seriesId);
        } else if (albumId) {
            await this.collectionRepo.addAlbum(created.id, albumId);
        }

        return created;
    }
}
