import {
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { PlayList } from "../Lists/PlayList.model";
import { PlayListItem } from "../Lists/PlayListItem.model";
import { Album } from "./Album.model";

@Table({ tableName: "Song", timestamps: false })
export class Song extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0], // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "file_src",
  })
  fileSrc!: string;

  @ForeignKey(() => Album)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    onDelete: "CASCADE",
    field: "album_id",
  })
  albumId!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "",
  })
  title!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: "",
  })
  duration!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "track_number",
    defaultValue: 0,
  })
  trackNumber!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "disc_number",
    defaultValue: 0,
  })
  discNumber!: number;

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  composers!: string[];

  @Column({
    type: DataType.JSON,
    allowNull: false,
    defaultValue: [],
  })
  artists!: string[];

  @BelongsToMany(() => PlayList, {
    through: () => PlayListItem,
    onDelete: "CASCADE",
    hooks: true,
  })
  playLists!: PlayList[];
}
[];
