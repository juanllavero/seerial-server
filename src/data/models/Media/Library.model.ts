import {
  Column,
  DataType,
  HasMany,
  IsIn,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Collection } from '../Collections/Collection.model';
import { Album } from '../music/Album.model';
import { Movie } from './Movie.model';
import { Series } from './Series.model';

@Table({ tableName: 'Library', timestamps: false })
export class Library extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => uuidv4(), // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  language!: string;

  @IsIn([['Shows', 'Movies', 'Music']])
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  type!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  hidden!: boolean;

  @Column({
    type: DataType.TEXT,
    defaultValue: '[]',
    allowNull: false,
    get() {
      const value = this.getDataValue('folders');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('folders', JSON.stringify(value));
    },
  })
  folders!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'prefer_audio_lan',
  })
  preferAudioLan?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'prefer_sub_lan',
  })
  preferSubLan?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'subs_mode',
  })
  subsMode?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: '{}',
    field: 'analyzed_files',
  })
  analyzedFiles!: Map<string, string>;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: '{}',
    field: 'analyzed_folders',
  })
  analyzedFolders!: Map<string, string>;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: '{}',
    field: 'season_folders',
  })
  seasonFolders!: Map<string, string>;

  @HasMany(() => Series)
  series!: Series[];

  @HasMany(() => Movie)
  movies!: Movie[];

  @HasMany(() => Album)
  albums!: Album[];

  @HasMany(() => Collection)
  collections!: Collection[];
}
