import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Song } from "../music/Song.model";
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
    type: DataType.INTEGER,
    allowNull: false,
    field: "playlist_id",
  })
  playlistId!: string;

  @ForeignKey(() => Song)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "song_id",
  })
  songId!: string;
}
