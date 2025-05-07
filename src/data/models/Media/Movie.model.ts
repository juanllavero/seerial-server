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
import { CollectionMovie } from "../Collections/CollectionMovie.model";
import { Library } from "./Library.model";
import { Video } from "./Video.model";

@Table({ tableName: "Movie", timestamps: false })
export class Movie extends Model {
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
    type: DataType.STRING,
    allowNull: false,
    field: "imdb_id",
    defaultValue: "",
  })
  imdbId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "themdb_id",
    defaultValue: 0,
  })
  themdbId!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    field: "imdb_score",
    defaultValue: 0,
  })
  imdbScore!: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  score!: number;

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
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "",
  })
  tagline!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "tagline_lock",
    defaultValue: false,
  })
  taglineLock!: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  genres!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "genres_lock",
    defaultValue: false,
  })
  genresLock!: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: "production_studios",
    defaultValue: [],
  })
  productionStudios!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "production_studios_lock",
    defaultValue: false,
  })
  productionStudiosLock!: boolean;

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
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  creator!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "creator_lock",
    defaultValue: false,
  })
  creatorLock!: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: "music_composer",
    defaultValue: [],
  })
  musicComposer!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: "music_composer_lock",
    defaultValue: false,
  })
  musicComposerLock!: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  cast!: Cast[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "logo_src",
    defaultValue: "",
  })
  logoSrc!: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: "logos_urls",
    defaultValue: [],
  })
  logosUrls!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "cover_src",
    defaultValue: "",
  })
  coverSrc!: string;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    field: "covers_urls",
    defaultValue: [],
  })
  coversUrls!: string[];

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
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  watched!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "",
  })
  folder!: string;

  @BelongsToMany(() => Collection, () => CollectionMovie)
  collections!: Collection[];

  @HasMany(() => Video, { foreignKey: "movieId", as: "videos" })
  videos!: Video[];

  @HasMany(() => Video, { foreignKey: "extraId", as: "extras" })
  extras!: Video[];
}
