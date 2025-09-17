import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Episode } from "../Media/Episode.model";
import { Movie } from "../Media/Movie.model";
import { Season } from "../Media/Season.model";
import { Series } from "../Media/Series.model";
import { Video } from "../Media/Video.model";

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

  @ForeignKey(() => Movie)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "movie_id",
    onDelete: "CASCADE",
  })
  movieId?: string;

  @ForeignKey(() => Video)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "video_id",
    onDelete: "CASCADE",
  })
  videoId?: string;

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
