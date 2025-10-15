import { Episode, Movie, Season, Series, Video } from "@/api/v0/index.models";
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
export class WatchList extends Model {
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
    onDelete: "CASCADE",
  })
  seriesId?: string;

  @ForeignKey(() => Season)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "season_id",
    onDelete: "CASCADE",
  })
  seasonId?: string;

  @ForeignKey(() => Episode)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "episode_id",
    onDelete: "CASCADE",
  })
  episodeId?: string;

  @BelongsTo(() => Episode, {
    onDelete: "CASCADE",
    hooks: true,
  })
  episode?: Episode;

  @ForeignKey(() => Movie)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "movie_id",
    onDelete: "CASCADE",
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
    allowNull: true,
    field: "video_id",
    onDelete: "CASCADE",
  })
  videoId?: string;

  @BelongsTo(() => Video, {
    onDelete: "CASCADE",
    hooks: true,
  })
  video?: Video;

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
