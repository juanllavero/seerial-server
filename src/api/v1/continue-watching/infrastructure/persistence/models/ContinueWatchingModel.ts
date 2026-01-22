import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
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
export class ContinueWatchingModel extends Model {
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

  @ForeignKey(() => SeriesModel)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "series_id",
  })
  seriesId?: string;

  @BelongsTo(() => SeriesModel, {
    onDelete: "CASCADE",
    hooks: true,
  })
  series?: SeriesModel;

  @ForeignKey(() => MovieModel)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "movie_id",
  })
  movieId?: string;

  @BelongsTo(() => MovieModel, {
    onDelete: "CASCADE",
    hooks: true,
  })
  movie?: MovieModel;

  @ForeignKey(() => VideoModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "video_id",
    onDelete: "CASCADE",
  })
  videoId!: string;

  @BelongsTo(() => VideoModel, {
    onDelete: "CASCADE",
    hooks: true,
  })
  video!: VideoModel;
}
