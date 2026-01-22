import { SeasonModel } from "@/api/v1/seasons/infrastructure/persistence/models/SeasonModel";
import { VideoModel } from "@/api/v1/videos/infrastructure/persistence/models/VideoModel";
import { WatchListModel } from "@/api/v1/watch-lists/infrastructure/persistence/models/WatchListModel";
import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "Episode", timestamps: false })
export class EpisodeModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0],
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => SeasonModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "season_id",
  })
  seasonId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "",
  })
  name!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "name_lock",
    defaultValue: false,
  })
  nameLock!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "",
  })
  year!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "year_lock",
    defaultValue: false,
  })
  yearLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    defaultValue: "",
  })
  overview!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "overview_lock",
    defaultValue: false,
  })
  overviewLock!: boolean;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  score!: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: "directed_by",
    defaultValue: [],
  })
  directedBy!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "directed_by_lock",
    defaultValue: false,
  })
  directedByLock!: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: "written_by",
    defaultValue: [],
  })
  writtenBy!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "written_by_lock",
    defaultValue: false,
  })
  writtenByLock!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "episode_number",
    defaultValue: 0,
  })
  episodeNumber!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "season_number",
    defaultValue: 0,
  })
  seasonNumber!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  order!: number;

  @HasMany(() => WatchListModel)
  watchLists!: WatchListModel[];

  @BelongsTo(() => SeasonModel, { onDelete: "CASCADE" })
  season!: SeasonModel;

  @HasOne(() => VideoModel)
  video!: VideoModel;
}
