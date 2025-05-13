import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Album } from "./Album.model";
import { AlbumArtist } from "./AlbumArtist.model";

@Table({ tableName: "Artist", timestamps: false })
export class Artist extends Model {
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
  name!: string;

  @BelongsToMany(() => Album, {
    through: () => AlbumArtist,
    onDelete: "CASCADE",
    hooks: true,
  })
  albums!: Album[];
}
