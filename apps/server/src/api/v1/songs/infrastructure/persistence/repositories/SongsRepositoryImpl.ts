import { v4 as uuidv4 } from 'uuid';
import { BaseRepository } from '@/api/v1/base-repository/BaseRepository';
import { GenericRepositoryHelper } from '@/helpers/GenericRepositoryHelper';
import logger from '@/utils/logger';
import type { SongsRepositoryPort } from '../../../application/ports/SongsRepositoryPort';
import type { Song } from '../../../domain/Song';
import { SongModel } from '../models/SongModel';

export class SongsRepositoryImpl extends BaseRepository implements SongsRepositoryPort {
  // Generic helper for common CRUD operations
  private helper: GenericRepositoryHelper<SongModel, Song>;

  constructor() {
    super();

    // Initialize helper
    this.helper = new GenericRepositoryHelper(SongModel, {
      entityName: 'Song',
      generateShortId: true,
    });
  }

  async findById(id: string): Promise<Song | null> {
    const validatedId = this.validateId(id, 'Song ID');
    return this.helper.findById(validatedId);
  }

  async findByPath(path: string): Promise<Song | null> {
    this.validateData(path, 'Path data');
    return this.helper.findByField('fileSrc', path);
  }

  async findByAlbum(albumId: string): Promise<Song[]> {
    const validatedId = this.validateId(albumId, 'Album ID');
    return this.helper.findManyByField('albumId', validatedId);
  }

  async create(song: Partial<Song>): Promise<Song | null> {
    this.validateData(song, 'Song data');

    // Check if song already exists by ID
    if (song.id) {
      const existingSong = await this.findById(song.id);
      if (existingSong) {
        logger.info(`Song with ID ${song.id} already exists`);
        return existingSong;
      }
    }

    // Generate UUID if it doesn't exist
    const dataToCreate = {
      ...song,
      id: song.id || uuidv4().split('-')[0],
    };

    return this.helper.create(dataToCreate, true);
  }

  async update(id: string, data: Partial<Song>): Promise<Song> {
    const validatedId = this.validateId(id, 'Song ID');
    this.validateData(data, 'Update data');
    return this.helper.update(validatedId, data);
  }

  async delete(id: string): Promise<void> {
    const validatedId = this.validateId(id, 'Song ID');
    return this.helper.delete(validatedId);
  }
}
