import {
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Cast } from "../../interfaces/Media";
import { Collection } from "../Collections/Collection.model";
import { CollectionSeries } from "../Collections/CollectionSeries.model";
import { Library } from "./Library.model";
import { Season } from "./Season.model";

@Table({ tableName: "Series", timestamps: false })
export class Series extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0], // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Library)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: "CASCADE",
    field: "library_id",
  })
  libraryId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: -1,
    field: "themdb_id",
  })
  themdbId!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    allowNull: false,
  })
  order!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "name_lock",
  })
  nameLock!: boolean;

  @Column({
    type: DataType.TEXT,
    defaultValue: "",
    allowNull: false,
  })
  overview!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "oberview_lock",
  })
  overviewLock!: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
  })
  year!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: "year_lock",
  })
  yearLock!: boolean;

  @Column({
    type: DataType.FLOAT,
    defaultValue: 0,
    allowNull: false,
  })
  score!: number;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
  })
  tagline!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "tagline_lock",
  })
  taglineLock!: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
    field: "logo_src",
  })
  logoSrc!: string;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
    field: "logos_urls",
  })
  logosUrls!: string[];

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
    field: "cover_src",
  })
  coverSrc!: string;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
    field: "covers_urls",
  })
  coversUrls!: string[];

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
    field: "production_studios",
  })
  productionStudios!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "production_studios_lock",
  })
  productionStudiosLock!: boolean;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
  })
  creator!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "creator_lock",
  })
  creatorLock!: boolean;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
    field: "music_composer",
  })
  musicComposer!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "music_composer_lock",
  })
  musicComposerLock!: boolean;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
  })
  genres!: string[];

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "genres_lock",
  })
  genresLock!: boolean;

  @Column({
    type: DataType.JSON,
    defaultValue: [],
    allowNull: false,
  })
  cast!: Cast[];

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
  })
  folder!: string;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
    field: "episode_group_id",
  })
  episodeGroupId!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
    field: "analyzing_files",
  })
  analyzingFiles!: boolean;

  @Column({
    type: DataType.STRING,
    defaultValue: "",
    allowNull: false,
    field: "currently_watching_episode_id",
  })
  currentlyWatchingEpisodeId!: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "prefer_audio_lan" })
  preferAudioLan?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "prefer_sub_lan" })
  preferSubLan?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "subs_mode" })
  subsMode?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    allowNull: false,
  })
  watched!: boolean;

  @BelongsToMany(() => Collection, {
    through: () => CollectionSeries,
    onDelete: "CASCADE",
    hooks: true,
  })
  collections!: Collection[];

  @HasMany(() => Season)
  seasons!: Season[];
}
