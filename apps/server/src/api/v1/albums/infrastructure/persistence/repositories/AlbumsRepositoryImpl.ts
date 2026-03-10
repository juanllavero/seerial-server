import { BaseRepository } from '@/api/v1/base-repository/BaseRepository';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';
import type { AlbumsRepositoryPort } from '../../../application/ports/AlbumsRepositoryPort';
import type { Album } from '../../../domain/Album';
import { AlbumArtistModel } from '../models/AlbumArtistModel';
import { AlbumModel } from '../models/AlbumModel';

export class AlbumsRepositoryImpl extends BaseRepository implements AlbumsRepositoryPort {
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<AlbumModel, Album>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(AlbumModel, {
      entityName: 'Album',
      generateShortId: true,
    });
  }

  async findAll(libraryId: string): Promise<Album[]> {
    const validatedId = this.validateId(libraryId, 'Library ID');
    return this.helper.findManyByField('libraryId', validatedId);
  }

  async findById(id: string, includeSongs = true): Promise<Album | null> {
    const validatedId = this.validateId(id, 'Album ID');

    const relations = ['artists'];
    if (includeSongs) {
      relations.push('songs');
    }

    return this.helper.findById(validatedId, {
      relations,
    });
  }

  async create(album: Partial<Album>): Promise<Album> {
    this.validateData(album, 'Album data');
    return this.helper.create(album, true);
  }

  async update(id: string, data: Partial<Album>): Promise<Album> {
    const validatedId = this.validateId(id, 'Album ID');
    this.validateData(data, 'Update data');
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, 'Album ID');
    return this.helper.delete(validatedId);
  }

  async addArtistToAlbum(
    artistId: string,
    albumId: string,
  ): Promise<{ id: string; artistId: string; albumId: string }> {
    const validated = this.validateIds({ artistId, albumId });

    const relationData = {
      artistId: validated.artistId,
      albumId: validated.albumId,
    };

    const createdRelation = await this.helper.createRelationship(
      AlbumArtistModel,
      relationData,
      true,
    );

    return createdRelation as any;
  }

  async removeArtistFromAlbum(artistId: string, albumId: string): Promise<void> {
    const validated = this.validateIds({ artistId, albumId });

    const whereCondition = {
      artistId: validated.artistId,
      albumId: validated.albumId,
    };

    return this.helper.deleteRelationship(AlbumArtistModel, whereCondition);
  }
}
