import { SongModel } from "@/api/v1/songs/infrastructure/persistence/models/SongModel";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { PlayListModel } from "./PlayListModel";

@Table({ tableName: "PlayList_Item", timestamps: false })
export class PlayListItemModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0],
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => PlayListModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "playlist_id",
    onDelete: "CASCADE",
  })
  playlistId!: string;

  @ForeignKey(() => SongModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "song_id",
    onDelete: "CASCADE",
  })
  songId!: string;
}
