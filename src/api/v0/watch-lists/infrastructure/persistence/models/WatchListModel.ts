import { EpisodeModel } from "@/api/v0/episodes/infrastructure/persistence/models/EpisodeModel";
import { MovieModel } from "@/api/v0/movies/infrastructure/persistence/models/MovieModel";
import { SeasonModel } from "@/api/v0/seasons/infrastructure/persistence/models/SeasonModel";
import { SeriesModel } from "@/api/v0/series/infrastructure/persistence/models/SeriesModel";
import { VideoModel } from "@/api/v0/videos/infrastructure/persistence/models/VideoModel";
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "Watch_List", timestamps: true })
export class WatchListModel extends Model {
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
    onDelete: "CASCADE",
  })
  seriesId?: string;

  @ForeignKey(() => SeasonModel)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "season_id",
    onDelete: "CASCADE",
  })
  seasonId?: string;

  @ForeignKey(() => EpisodeModel)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "episode_id",
    onDelete: "CASCADE",
  })
  episodeId?: string;

  @BelongsTo(() => EpisodeModel, {
    onDelete: "CASCADE",
    hooks: true,
  })
  episode?: EpisodeModel;

  @ForeignKey(() => MovieModel)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "movie_id",
    onDelete: "CASCADE",
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
    allowNull: true,
    field: "video_id",
    onDelete: "CASCADE",
  })
  videoId?: string;

  @BelongsTo(() => VideoModel, {
    onDelete: "CASCADE",
    hooks: true,
  })
  video?: VideoModel;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
    field: "time_watched",
  })
  timeWatched!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
    field: "last_watched",
  })
  lastWatched!: string;
}
