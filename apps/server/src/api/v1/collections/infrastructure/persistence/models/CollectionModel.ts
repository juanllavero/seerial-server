import path from 'node:path';
import fs from 'fs-extra';
import {
  BaseEntity,
  BeforeInsert,
  BeforeRemove,
  Column,
  Entity,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { LibraryCollectionModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryCollectionModel';
import logger from '@/utils/logger';
import { CollectionAlbumModel } from './CollectionAlbum';
import { CollectionMovieModel } from './CollectionMovie';
import { CollectionSeriesModel } from './CollectionSeries';

const collectionLogger = logger.child({ category: 'Collection' });

@Entity({ name: 'Collection' })
export class CollectionModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false, unique: true })
  title!: string;

  @Column({ type: 'text', nullable: true, default: '' })
  description?: string;

  @Column({ type: 'varchar', nullable: true, default: '' })
  posterSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
    name: 'posters_urls',
  })
  postersUrls!: string[];

  @Column({
    type: 'varchar',
    nullable: true,
    default: '',
    name: 'music_poster_src',
  })
  musicPosterSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
    name: 'music_posters_urls',
  })
  musicPostersUrls!: string[];

  @Column({
    type: 'varchar',
    nullable: false,
    default: '',
    name: 'background_src',
  })
  backgroundSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
    name: 'background_urls',
  })
  backgroundsUrls!: string[];

  @OneToMany(
    () => LibraryCollectionModel,
    (lc) => lc.collection,
    {
      cascade: true,
    },
  )
  libraryCollections!: LibraryCollectionModel[];

  @OneToMany(
    () => CollectionMovieModel,
    (cm) => cm.collection,
    {
      cascade: true,
    },
  )
  collectionMovies!: CollectionMovieModel[];

  @OneToMany(
    () => CollectionSeriesModel,
    (cs) => cs.collection,
    {
      cascade: true,
    },
  )
  collectionSeries!: CollectionSeriesModel[];

  @OneToMany(
    () => CollectionAlbumModel,
    (ca) => ca.collection,
    {
      cascade: true,
    },
  )
  collectionAlbums!: CollectionAlbumModel[];

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
      await fs.remove(path.join('resources', 'img', 'backgrounds', this.id ?? ''));
      collectionLogger.info(`Cleaned data from collection ID=${this.id}`);
    } catch (error) {
      collectionLogger.error(error, `Error cleaning data for collection ID=${this.id}`);
    }
  }
}
