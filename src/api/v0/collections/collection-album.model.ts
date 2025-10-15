import { Album } from "@/api/v0/albums/albums.model";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { Collection } from "./collections.model";

@Table({ tableName: "Collection_Album", timestamps: false })
export class CollectionAlbum extends Model {
  @ForeignKey(() => Collection)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "collection_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  collectionId!: string;

  @ForeignKey(() => Album)
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
