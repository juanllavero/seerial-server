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
import { CollectionMovie } from '../Collections/CollectionMovie.model';
import { Library } from './Library.model';
import { Video } from './Video.model';

@Table({ tableName: 'Movie', timestamps: false })
export class Movie extends Model {
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
    type: DataType.STRING,
    allowNull: false,
    field: 'imdb_id',
  })
  imdbId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'themdb_id',
  })
  themdbId!: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    field: 'imdb_score',
  })
  imdbScore!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  score!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'name_lock',
  })
  nameLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  overview!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'overview_lock',
  })
  overviewLock!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  year!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'year_lock',
  })
  yearLock!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  tagline!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'tagline_lock',
  })
  taglineLock!: boolean;

  @Column({
    type: DataType.TEXT,
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
    allowNull: false,
    field: 'genres_lock',
  })
  genresLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
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
    allowNull: false,
  })
  productionStudiosLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('directedBy');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('directedBy', JSON.stringify(value));
    },
  })
  directedBy!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  directedByLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('writtenBy');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('writtenBy', JSON.stringify(value));
    },
  })
  writtenBy!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  writtenByLock!: boolean;

  @Column({
    type: DataType.TEXT,
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
    allowNull: false,
  })
  creatorLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
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
    allowNull: false,
  })
  musicComposerLock!: boolean;

  @Column({
    type: DataType.TEXT,
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
    allowNull: true,
  })
  logoSrc!: string[];

  @Column({
    type: DataType.TEXT,
    allowNull: false,
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
    allowNull: true,
  })
  coverSrc!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
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
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  watched!: boolean;

  @BelongsToMany(() => Collection, () => CollectionMovie)
  collections!: Collection[];

  @HasMany(() => Video, 'videoId')
  videos!: Video[];

  @HasMany(() => Video, 'extraId')
  extras!: Video[];
}
