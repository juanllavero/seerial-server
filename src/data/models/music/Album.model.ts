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
import { Collection } from '../Collections/Collection.model';
import { CollectionAlbum } from '../Collections/CollectionAlbum.model';
import { Library } from '../Media/Library.model';
import { AlbumArtist } from './AlbumArtist.model';
import { Artist } from './Artist.model';

@Table({ tableName: 'Album', timestamps: false })
export class Album extends Model {
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
  })
  title!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  year?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: '',
    field: 'cover_src',
  })
  coverSrc!: string;

  @BelongsToMany(() => Collection, () => CollectionAlbum)
  collections!: Collection[];

  @BelongsToMany(() => Artist, () => AlbumArtist)
  artists!: Artist[];
}
