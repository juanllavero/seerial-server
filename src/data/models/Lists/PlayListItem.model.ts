import { Song } from "@/data/models/music/Song.model";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { PlayList } from "./PlayList.model";

@Table({ tableName: "PlayList_Item", timestamps: false })
export class PlayListItem extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0], // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => PlayList)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "playlist_id",
    onDelete: "CASCADE",
  })
  playlistId!: string;

  @ForeignKey(() => Song)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "song_id",
    onDelete: "CASCADE",
  })
  songId!: string;
}
