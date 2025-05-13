import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Video } from "../Media/Video.model";

@Table({ tableName: "Continue_Watching", timestamps: true })
export class ContinueWatching extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: () => require("uuid").v4().split("-")[0],
  })
  id!: string;

  @ForeignKey(() => Video)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "video_id",
    onDelete: "CASCADE",
  })
  videoId!: string;

  @BelongsTo(() => Video, {
    onDelete: "CASCADE",
    hooks: true,
  })
  video!: Video;
}
