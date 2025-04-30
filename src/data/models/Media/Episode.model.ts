import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Season } from './Season.model';
import { Video } from './Video.model';

@Table({ tableName: 'Episode', timestamps: false })
export class Episode extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => uuidv4(), // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Season)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: 'CASCADE',
    field: 'season_id',
  })
  seasonId!: string;

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
    type: DataType.FLOAT,
    allowNull: false,
  })
  score!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'directed_by',
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
    field: 'directed_by_lock',
  })
  directedByLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    field: 'written_by',
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
    field: 'written_by_lock',
  })
  writtenByLock!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'episode_number',
  })
  episodeNumber!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'season_number',
  })
  seasonNumber!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue('video');
      return value ? JSON.parse(value) : {};
    },
    set(value: Video) {
      this.setDataValue('video', JSON.stringify(value));
    },
  })
  video!: Video;
}
