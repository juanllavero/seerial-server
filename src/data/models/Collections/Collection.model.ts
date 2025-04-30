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

  @BelongsToMany(() => Movie, () => CollectionMovie)
  movies!: Movie[];

  @BelongsToMany(() => Series, () => CollectionSeries)
  shows!: Series[];

  @BelongsToMany(() => Album, () => CollectionAlbum)
  albums!: Album[];
}
