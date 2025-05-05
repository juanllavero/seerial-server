import {
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { Video } from '../Media/Video.model';

@Table({ tableName: 'Continue_Watching', timestamps: true })
export class ContinueWatching extends Model {
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Video)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'video_id',
  })
  videoId!: string;

  @HasOne(() => Video)
  video!: Video;
}
