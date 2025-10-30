import { AlbumModel } from "@/api/v0/albums/infrastructure/persistence/models/AlbumModel";
import { PlayListItemModel } from "@/api/v0/playlists/infrastructure/persistence/models/PlayListItemModel";
import { PlayListModel } from "@/api/v0/playlists/infrastructure/persistence/models/PlayListModel";
import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "Song", timestamps: false })
export class SongModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0],
    allowNull: false,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "file_src",
  })
  fileSrc!: string;

  @ForeignKey(() => AlbumModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
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
    type: DataType.BOOLEAN,
    allowNull: true,
    field: "has_dolby_atmos",
  })
  hasDolbyAtmos!: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "",
  })
  codec!: string;

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

  @BelongsTo(() => AlbumModel, { onDelete: "CASCADE", hooks: true })
  album!: AlbumModel;

  @BelongsToMany(() => PlayListModel, {
    through: () => PlayListItemModel,
    onDelete: "CASCADE",
    hooks: true,
  })
  playLists!: PlayListModel[];
}
[];
