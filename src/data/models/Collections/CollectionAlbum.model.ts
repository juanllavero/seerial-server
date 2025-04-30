import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Album } from '../music/Album.model';
import { Collection } from './Collection.model';

@Table({ tableName: 'Collection_Album', timestamps: false })
export class CollectionAlbum extends Model {
  @ForeignKey(() => Collection)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'collection_id',
  })
  collectionId!: string;

  @ForeignKey(() => Album)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'album_id',
  })
  albumId!: string;
}
