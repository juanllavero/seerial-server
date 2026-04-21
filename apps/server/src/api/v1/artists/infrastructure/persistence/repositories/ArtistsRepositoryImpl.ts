import type { Artist } from '@/api/v1/artists/domain/Artist';
import { ArtistModel } from '@/api/v1/artists/infrastructure/persistence/models/ArtistModel';
import { BaseRepository } from '@/api/v1/base-repository/BaseRepository';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';
import type { ArtistsRepositoryPort } from '../../../application/ports/ArtistsRepositoryPort';

export class ArtistsRepositoryImpl extends BaseRepository implements ArtistsRepositoryPort {
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<ArtistModel, Artist>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(ArtistModel, {
      entityName: 'Artist',
      generateShortId: true,
    });
  }

  async getById(id: string): Promise<Artist | null> {
    const validatedId = this.validateId(id, 'Artist ID');
    return this.helper.findById(validatedId, {
      relations: ['albums'],
    });
  }

  async getByName(name: string): Promise<Artist | null> {
    return this.helper.findByField('name', name);
  }

  async add(artistData: Partial<Artist>): Promise<Artist> {
    this.validateData(artistData, 'Artist data');

    // Check if artist already exists by name
    if (artistData.name) {
      const existing = await ArtistModel.findOne({
        where: { name: artistData.name },
      });
      if (existing) return existing as unknown as Artist;
    }

    return this.helper.create(artistData, true);
  }

  async update(id: string, data: Partial<Artist>): Promise<Artist> {
    const validatedId = this.validateId(id, 'Artist ID');
    this.validateData(data, 'Update data');
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<boolean> {
    const validatedId = this.validateId(id, 'Artist ID');
    await this.helper.delete(validatedId);
    return true;
  }
}
