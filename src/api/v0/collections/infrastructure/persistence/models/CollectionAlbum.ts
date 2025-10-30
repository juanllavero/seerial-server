import { AlbumModel } from "@/api/v0/albums/infrastructure/persistence/models/AlbumModel";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { CollectionModel } from "./CollectionModel";

@Table({ tableName: "Collection_Album", timestamps: false })
export class CollectionAlbumModel extends Model {
  @ForeignKey(() => CollectionModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "collection_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  collectionId!: string;

  @ForeignKey(() => AlbumModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "album_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  albumId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "custom_order",
    defaultValue: 0,
  })
  customOrder!: number;
}
