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
import { CollectionSeriesModel } from '@/api/v1/collections/infrastructure/persistence/models/CollectionSeries';
import { LibraryModel } from '@/api/v1/libraries/infrastructure/persistence/models/LibraryModel';
import { SeasonModel } from '@/api/v1/seasons/infrastructure/persistence/models/SeasonModel';
import { WatchListModel } from '@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel';

@Entity({ name: 'Series' })
export class SeriesModel extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', nullable: false })
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  libraryId!: string;

  @Column({ type: 'integer', nullable: false, default: -1 })
  themdbId!: number;

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

  @Column({ type: 'float', nullable: false, default: 0 })
  score!: number;

  @Column({ type: 'varchar', nullable: false, default: '' })
  tagline!: string;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  taglineLock!: boolean;

  @Column({ type: 'varchar', nullable: false, default: '' })
  logoSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
  })
  logosUrls!: string[];

  @Column({ type: 'varchar', nullable: false, default: '' })
  coverSrc!: string;

  @Column({
    type: 'simple-json',
    nullable: false,
    default: '[]',
  })
  coversUrls!: string[];

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
  genres!: string[];

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  genresLock!: boolean;

  @Column({ type: 'simple-json', nullable: false, default: '[]' })
  cast!: CastData[];

  @Column({ type: 'varchar', nullable: false, default: '' })
  folder!: string;

  @Column({ type: 'varchar', nullable: true })
  episodeGroupId!: string | null;

  @Column({
    type: 'boolean',
    nullable: false,
    default: false,
  })
  analyzingFiles!: boolean;

  @Column({ type: 'varchar', nullable: true })
  preferAudioLan?: string;

  @Column({ type: 'varchar', nullable: true })
  preferSubLan?: string;

  @Column({ type: 'varchar', nullable: true })
  subsMode?: string;

  @ManyToOne(
    () => LibraryModel,
    (library) => library.series,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'library_id' })
  library!: LibraryModel;

  @OneToMany(
    () => CollectionSeriesModel,
    (cs) => cs.series,
    { cascade: true },
  )
  collectionSeries!: CollectionSeriesModel[];

  @OneToMany(
    () => SeasonModel,
    (season) => season.series,
  )
  seasons!: SeasonModel[];

  @OneToMany(
    () => WatchListModel,
    (watchList) => watchList.series,
  )
  watchLists!: WatchListModel[];

  // Lifecycle hooks
  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv4().split('-')[0];
    }
  }
}
