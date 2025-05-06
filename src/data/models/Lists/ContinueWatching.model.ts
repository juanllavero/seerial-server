import {
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Video } from '../Media/Video.model';

@Table({ tableName: 'Continue_Watching', timestamps: true })
export class ContinueWatching extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Video)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'video_id',
  })
  videoId!: string;

  @HasOne(() => Video)
  video!: Video;
}
