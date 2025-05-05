import {
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Library } from '../Media/Library.model';
import { Movie } from '../Media/Movie.model';
import { Series } from '../Media/Series.model';
import { Album } from '../music/Album.model';
import { CollectionAlbum } from './CollectionAlbum.model';
import { CollectionMovie } from './CollectionMovie.model';
import { CollectionSeries } from './CollectionSeries.model';

@Table({ tableName: 'Collection', timestamps: false })
export class Collection extends Model {
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
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @ForeignKey(() => Library)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    onDelete: 'CASCADE',
    field: 'library_id',
  })
  libraryId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'cover_src',
  })
  coverSrc!: string;

  @Column({
    type: DataType.TEXT,
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
    type: DataType.STRING,
    allowNull: false,
    field: 'background_src',
  })
  backgroundSrc!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'background_urls',
    get() {
      const value = this.getDataValue('backgroundsUrls');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('backgroundsUrls', JSON.stringify(value));
    },
  })
  backgroundsUrls!: string[];

  @BelongsToMany(() => Movie, () => CollectionMovie)
  movies!: Movie[];

  @BelongsToMany(() => Series, () => CollectionSeries)
  shows!: Series[];

  @BelongsToMany(() => Album, () => CollectionAlbum)
  albums!: Album[];
}
