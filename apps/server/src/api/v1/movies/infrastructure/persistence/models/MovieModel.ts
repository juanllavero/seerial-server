import type { CastData } from '@seerial/domain';
import {
  BaseEntity,
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CollectionMovieModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionMovie';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { MyListModel } from '@/api/v1/my-lists/infrastructure/persistence/models/MyListModel';
import { VideoModel } from '@/api/v1/videos/infrastructure/persistence/models/VideoModel';
import { WatchListModel } from '@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel';

@Entity({ name: 'Movie' })
export class MovieModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  libraryId!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  imdbId!: string;

  @Column({ type: 'integer', nullable: false, default: -1 })
  themdbId!: number;

  @Column({ type: 'float', nullable: false, default: 0 })
  imdbScore!: number;

  @Column({ type: 'float', nullable: false, default: 0 })
  score!: number;

  @Column({ type: 'integer', nullable: false, default: 0 })
  order!: number;

  @Column({ type: 'varchar', nullable: false, default: '' })
  name!: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  nameLock!: boolean;

  @Column({ type: 'text', nullable: false, default: '' })
  overview!: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  overviewLock!: boolean;

  @Column({ type: 'varchar', nullable: false, default: '' })
  year!: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  yearLock!: boolean;

  @Column({ type: 'varchar', nullable: false, default: '' })
  tagline!: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  taglineLock!: boolean;

  @Column({ type: 'simple-json', nullable: false, default: '[]' })
  genres!: string[];

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  genresLock!: boolean;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
  })
  productionStudios!: string[];

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  productionStudiosLock!: boolean;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
  })
  directedBy!: string[];

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  directedByLock!: boolean;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
  })
  writtenBy!: string[];

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  writtenByLock!: boolean;

  @Column({ type: 'simple-json', nullable: false, default: '[]' })
  creator!: string[];

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  creatorLock!: boolean;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
  })
  musicComposer!: string[];

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  musicComposerLock!: boolean;

  @Column({ type: 'simple-json', nullable: false, default: '[]' })
  cast!: CastData[];

  @Column({ type: 'varchar', nullable: true, default: '' })
  logoSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
  })
  logosUrls!: string[];

  @Column({ type: 'varchar', nullable: true, default: '' })
  coverSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
  })
  coversUrls!: string[];

  @Column({
    type: 'varchar',
    nullable: false,
    default: '',
  })
  backgroundSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
  })
  backgroundsUrls!: string[];

  @Column({ type: 'varchar', nullable: false, default: '' })
  videoSrc!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  musicSrc!: string;

  @Column({ type: 'varchar', nullable: false, default: '' })
  folder!: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  analyzingFiles!: boolean;

  @ManyToOne(
    () => LibraryModel,
    (library) => library.movies,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'library_id' })
  library!: LibraryModel;

  @OneToMany(
    () => CollectionMovieModel,
    (cm) => cm.movie,
    { cascade: true },
  )
  collectionMovies!: CollectionMovieModel[];

  @OneToMany(
    () => VideoModel,
    (video) => video.movie,
  )
  videos!: VideoModel[];

  @OneToMany(
    () => VideoModel,
    (video) => video.extra,
  )
  extras!: VideoModel[];

  @OneToMany(
    () => WatchListModel,
    (watchList) => watchList.movie,
  )
  watchLists!: WatchListModel[];

  @OneToMany(
    () => MyListModel,
    (myList) => myList.movie,
  )
  myLists!: MyListModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }
}
