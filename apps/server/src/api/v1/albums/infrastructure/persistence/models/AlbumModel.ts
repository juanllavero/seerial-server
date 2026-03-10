import path from 'node:path';
import fs from 'fs-extra';
import {
  BaseEntity,
  BeforeInsert,
  BeforeRemove,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CollectionAlbumModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionAlbum';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { SongModel } from '@/api/v1/songs/infrastructure/persistence/models/SongModel';
import logger from '@/utils/logger';
import { AlbumArtistModel } from './AlbumArtistModel';

const albumLogger = logger.child({ category: 'Album' });

@Entity({ name: 'Album' })
export class AlbumModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  libraryId!: string;

  @Column({ type: 'integer', nullable: false, default: 0 })
  order!: number;

  @Column({ type: 'varchar', nullable: false, default: '' })
  title!: string;

  @Column({ type: 'varchar', nullable: true, default: '' })
  year?: string;

  @Column({ type: 'simple-json', nullable: true, default: '[]' })
  genres!: string[];

  @Column({ type: 'text', nullable: true, default: '' })
  description?: string;

  @Column({ type: 'text', nullable: true, default: '' })
  coverSrc!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  folder!: string;

  @ManyToOne(
    () => LibraryModel,
    (library) => library.albums,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'library_id' })
  library!: LibraryModel;

  @OneToMany(
    () => CollectionAlbumModel,
    (ca) => ca.album,
    { cascade: true },
  )
  collectionAlbums!: CollectionAlbumModel[];

  @OneToMany(
    () => AlbumArtistModel,
    (aa) => aa.album,
  )
  albumArtists!: AlbumArtistModel[];

  @OneToMany(
    () => SongModel,
    (song) => song.album,
  )
  songs!: SongModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }

  @BeforeRemove()
  async beforeRemove(): Promise<void> {
    try {
      await fs.remove(path.join('resources', 'img', 'posters', this.id ?? ''));
      albumLogger.info(`Cleaned data from album ID=${this.id}`);
    } catch (error) {
      albumLogger.error(error, `Error cleaning data for album ID=${this.id}`);
    }
  }
}
