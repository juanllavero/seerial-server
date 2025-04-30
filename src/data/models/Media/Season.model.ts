import {
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { v4 as uuidv4 } from "uuid";
import { Episode } from "./Episode.model";
import { Series } from "./Series.model";

@Table({ tableName: "Season", timestamps: false })
export class Season extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => uuidv4(), // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Series)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    onDelete: "CASCADE",
  })
  seriesid!: string;

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
    type: DataType.INTEGER,
    allowNull: false,
  })
  seasonNumber!: number;

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
    type: DataType.STRING,
    allowNull: false,
  })
  backgroundSrc!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
    get() {
      const value = this.getDataValue("backgroundsUrls");
      return value ? JSON.parse(value) : [];
    },
    set(value: string[]) {
      this.setDataValue("backgroundsUrls", JSON.stringify(value));
    },
  })
  backgroundsUrls!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  videoSrc!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  musicSrc!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  folder!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  audioTrackLanguage!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  selectedAudioTrack!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  subtitleTrackLanguage!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  selectedSubtitleTrack!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  watched!: boolean;

  @HasMany(() => Episode)
  episodes!: Episode[];
}
