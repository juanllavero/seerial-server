import { Artist } from "@/api/v0/artists/artists.model";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { Album } from "./albums.model";

@Table({ tableName: "Album_Artist", timestamps: false })
export class AlbumArtist extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0], // Generates default UUID
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => Artist)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "artist_id",
    onDelete: "CASCADE",
  })
  artistId!: string;

  @ForeignKey(() => Album)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "album_id",
    onDelete: "CASCADE",
  })
  albumId!: string;
}
