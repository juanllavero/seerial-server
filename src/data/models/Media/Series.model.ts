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
import { v4 as uuidv4 } from "uuid";
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
    defaultValue: () => uuidv4(), // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Library)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: "CASCADE",
  })
  libraryid!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  themdbid!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  order!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  nameLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  overview!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  overviewLock!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  year!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  yearLock!: boolean;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  score!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  tagline!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  taglineLock!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  logoSrc!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue("logosUrls");
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue("logosUrls", JSON.stringify(value));
    },
  })
  logosUrls!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  coverSrc!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue("coversUrls");
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue("coversUrls", JSON.stringify(value));
    },
  })
  coversUrls!: string[];

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue("productionStudios");
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue("productionStudios", JSON.stringify(value));
    },
  })
  productionStudios!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  productionStudiosLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue("creator");
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue("creator", JSON.stringify(value));
    },
  })
  creator!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  creatorLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue("musicComposer");
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue("musicComposer", JSON.stringify(value));
    },
  })
  musicComposer!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  musicComposerLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue("genres");
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue("genres", JSON.stringify(value));
    },
  })
  genres!: string[];

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  genresLock!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue("cast");
      return value ? JSON.parse(value) : [];
    },
    set(value: Cast[]) {
      this.setDataValue("cast", JSON.stringify(value));
    },
  })
  cast!: Cast[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  folder!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  episodeGroupID!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  analyzingFiles!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  currentlyWatchingEpisodeid!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  watched!: boolean;

  @BelongsToMany(() => Collection, () => CollectionSeries)
  collections!: Collection[];

  @HasMany(() => Season)
  seasons!: Season[];
}
