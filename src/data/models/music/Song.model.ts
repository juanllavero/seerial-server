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
import { PlayList } from '../Lists/PlayList.model';
import { PlayListItem } from '../Lists/PlayListItem.model';
import { Album } from './Album.model';

@Table({ tableName: 'Song', timestamps: false })
export class Song extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => uuidv4(), // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Album)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: 'CASCADE',
    field: 'album_id',
  })
  albumId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'track_number',
  })
  trackNumber!: number;

  @BelongsToMany(() => PlayList, () => PlayListItem)
  playLists!: PlayList[];
}
