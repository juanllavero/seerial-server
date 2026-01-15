import { ArtistModel } from "@/api/v1/artists/infrastructure/persistence/models/ArtistModel";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";
import { AlbumModel } from "./AlbumModel";

@Table({ tableName: "Album_Artist", timestamps: false })
export class AlbumArtistModel extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0],
    allowNull: false,
  })
  id!: string;

  @ForeignKey(() => ArtistModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "artist_id",
    onDelete: "CASCADE",
  })
  artistId!: string;

  @ForeignKey(() => AlbumModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "album_id",
    onDelete: "CASCADE",
  })
  albumId!: string;
}
