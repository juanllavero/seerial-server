import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Song } from "../music/Song.model";
import { PlayListItem } from "./PlayListItem.model";

@Table({ tableName: "PlayList", timestamps: false })
export class PlayList extends Model {
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
  })
  title!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: "",
  })
  description?: string;

  @BelongsToMany(() => Song, () => PlayListItem)
  songs!: Song[];
}
