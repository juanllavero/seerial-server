import { Movie } from "@/data/models/Media/Movie.model";
import { Series } from "@/data/models/Media/Series.model";
import { Video } from "@/data/models/Media/Video.model";
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "Continue_Watching", timestamps: true })
export class ContinueWatching extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: () => require("uuid").v4().split("-")[0],
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "user_id",
  })
  userId!: string;

  @ForeignKey(() => Series)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "series_id",
  })
  seriesId?: string;

  @BelongsTo(() => Series, {
    onDelete: "CASCADE",
    hooks: true,
  })
  series?: Series;

  @ForeignKey(() => Movie)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "movie_id",
  })
  movieId?: string;

  @BelongsTo(() => Movie, {
    onDelete: "CASCADE",
    hooks: true,
  })
  movie?: Movie;

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
