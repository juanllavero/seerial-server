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

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'file_src',
  })
  fileSrc!: string;

  @ForeignKey(() => Album)
  @Column({
    type: DataType.STRING,
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
  })
  duration!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'track_number',
  })
  trackNumber!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'disc_number',
  })
  discNumber!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('composers');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('composers', JSON.stringify(value));
    },
  })
  composers!: string[];

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('artists');
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue('artists', JSON.stringify(value));
    },
  })
  artists!: string[];

  @BelongsToMany(() => PlayList, () => PlayListItem)
  playLists!: PlayList[];
}
