import { AlbumArtistModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumArtistModel";
import { AlbumModel } from "@/api/v1/albums/infrastructure/persistence/models/AlbumModel";
import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "Artist", timestamps: false })
export class ArtistModel extends Model {
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
  })
  name!: string;

  @BelongsToMany(() => AlbumModel, () => AlbumArtistModel)
  albums!: AlbumModel[];
}
