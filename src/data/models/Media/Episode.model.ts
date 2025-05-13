import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasOne,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Season } from "./Season.model";
import { Video } from "./Video.model";

@Table({ tableName: "Episode", timestamps: false })
export class Episode extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0], // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Season)
  @Column({
    type: DataType.INTEGER,
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

  @BelongsTo(() => Season, { onDelete: "CASCADE" })
  season!: Season;

  @HasOne(() => Video)
  video!: Video;
}
