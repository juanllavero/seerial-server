import {
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Cast } from '../../interfaces/Media';
import { Collection } from '../Collections/Collection.model';
import { CollectionSeries } from '../Collections/CollectionSeries.model';
import { Library } from './Library.model';
import { Season } from './Season.model';

@Table({ tableName: 'Series', timestamps: false })
export class Series extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => uuidv4(), // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Library)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: 'CASCADE',
    field: 'library_id',
  })
  libraryId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: '',
    field: 'themdb_id',
  })
  themdbId!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  order!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: '',
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'name_lock',
  })
  nameLock!: boolean;

  @Column({
    type: DataType.TEXT,
    defaultValue: '',
    allowNull: false,
  })
  overview!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'oberview_lock',
  })
  overviewLock!: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: '',
    allowNull: false,
  })
  year!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'year_lock',
  })
  yearLock!: boolean;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
    allowNull: false,
  })
  score!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: '',
    allowNull: false,
  })
  tagline!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'tagline_lock',
  })
  taglineLock!: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: '',
    allowNull: false,
    field: 'logo_src',
  })
  logoSrc!: string;

  @Column({
    type: DataType.TEXT,
    defaultValue: [],
    allowNull: false,
    field: 'logos_urls',
    get() {
      const value = this.getDataValue('logosUrls');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('logosUrls', JSON.stringify(value));
    },
  })
  logosUrls!: string[];

  @Column({
    type: DataType.STRING,
    defaultValue: '',
    allowNull: false,
    field: 'cover_src',
  })
  coverSrc!: string;

  @Column({
    type: DataType.TEXT,
    defaultValue: [],
    allowNull: false,
    field: 'covers_urls',
    get() {
      const value = this.getDataValue('coversUrls');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('coversUrls', JSON.stringify(value));
    },
  })
  coversUrls!: string[];

  @Column({
    type: DataType.TEXT,
    defaultValue: [],
    allowNull: false,
    field: 'production_studios',
    get() {
      const value = this.getDataValue('productionStudios');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('productionStudios', JSON.stringify(value));
    },
  })
  productionStudios!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'production_studios_lock',
  })
  productionStudiosLock!: boolean;

  @Column({
    type: DataType.TEXT,
    defaultValue: [],
    allowNull: false,
    get() {
      const value = this.getDataValue('creator');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('creator', JSON.stringify(value));
    },
  })
  creator!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'creator_lock',
  })
  creatorLock!: boolean;

  @Column({
    type: DataType.TEXT,
    defaultValue: [],
    allowNull: false,
    field: 'music_composer',
    get() {
      const value = this.getDataValue('musicComposer');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('musicComposer', JSON.stringify(value));
    },
  })
  musicComposer!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'music_composer_lock',
  })
  musicComposerLock!: boolean;

  @Column({
    type: DataType.TEXT,
    defaultValue: [],
    allowNull: false,
    get() {
      const value = this.getDataValue('genres');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('genres', JSON.stringify(value));
    },
  })
  genres!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'genres_lock',
  })
  genresLock!: boolean;

  @Column({
    type: DataType.TEXT,
    defaultValue: [],
    allowNull: false,
    get() {
      const value = this.getDataValue('cast');
      return value ? JSON.parse(value) : [];
    },
    set(value: Cast[]) {
      this.setDataValue('cast', JSON.stringify(value));
    },
  })
  cast!: Cast[];

  @Column({
    type: DataType.STRING,
    defaultValue: '',
    allowNull: false,
  })
  folder!: string;

  @Column({
    type: DataType.STRING,
    defaultValue: '',
    allowNull: false,
    field: 'episode_group_id',
  })
  episodeGroupId!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: 'analyzing_files',
  })
  analyzingFiles!: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: '',
    allowNull: false,
    field: 'currently_watching_episode_id',
  })
  currentlyWatchingEpisodeId!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  watched!: boolean;

  @BelongsToMany(() => Collection, () => CollectionSeries)
  collections!: Collection[];

  @HasMany(() => Season)
  seasons!: Season[];
}
