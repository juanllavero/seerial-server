import { SongModel } from "@/api/v1/songs/infrastructure/persistence/models/SongModel";
import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { PlayListItemModel } from "./PlayListItemModel";

@Table({ tableName: "PlayList", timestamps: false })
export class PlayListModel extends Model {
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
    field: "user_id",
  })
  userId!: string;

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

  @BelongsToMany(() => SongModel, {
    through: () => PlayListItemModel,
    onDelete: "CASCADE",
    hooks: true,
  })
  songs!: SongModel[];
}
