import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Album } from './Album.model';
import { Artist } from './Artist.model';

@Table({ tableName: 'Album_Artist', timestamps: false })
export class AlbumArtist extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => uuidv4(), // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Artist)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'artist_id',
  })
  artistId!: string;

  @ForeignKey(() => Album)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'album_id',
  })
  albumId!: string;
}
