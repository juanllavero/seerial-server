import { CollectionModel } from "@/api/v0/collections/infrastructure/persistence/models/CollectionModel";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { LibraryModel } from "./LibraryModel";

@Table({ tableName: "Library_Collection", timestamps: false })
export class LibraryCollectionModel extends Model {
  @ForeignKey(() => LibraryModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "library_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  libraryId!: string;

  @ForeignKey(() => CollectionModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "collection_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  collectionId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "custom_order",
    defaultValue: 0,
  })
  customOrder!: number;
}
