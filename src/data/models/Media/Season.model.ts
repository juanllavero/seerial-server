import {
  BeforeDestroy,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { deleteSeasonData } from "../../../db/delete/deleteData";
import { Episode } from "./Episode.model";
import { Series } from "./Series.model";

@Table({ tableName: "Season", timestamps: false })
export class Season extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0], // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Series)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "series_id",
  })
  seriesId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  order!: number;

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
    type: DataType.INTEGER,
    allowNull: false,
    field: "season_number",
    defaultValue: 0,
  })
  seasonNumber!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "background_src",
    defaultValue: "",
  })
  backgroundSrc!: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: "background_urls",
    defaultValue: [],
  })
  backgroundsUrls!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "video_src",
    defaultValue: "",
  })
  videoSrc!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "music_src",
    defaultValue: "",
  })
  musicSrc!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  watched!: boolean;

  @BelongsTo(() => Series, { onDelete: "CASCADE" })
  series!: Series;

  @HasMany(() => Episode)
  episodes!: Episode[];

  @BeforeDestroy
  static async beforeDestroyHook(instance: Season): Promise<void> {
    try {
      await deleteSeasonData(instance);
      console.log(`Cleaned data from season ID=${instance.id}`);
    } catch (error) {
      console.error(`Error cleaning data for season ID=${instance.id}:`, error);
    }
  }
}
