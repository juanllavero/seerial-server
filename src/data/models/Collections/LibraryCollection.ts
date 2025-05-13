import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { Library } from "../Media/Library.model";
import { Collection } from "./Collection.model";

@Table({ tableName: "Library_Collection", timestamps: false })
export class LibraryCollection extends Model {
  @ForeignKey(() => Library)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "library_id",
    onDelete: "CASCADE",
  })
  libraryId!: string;

  @ForeignKey(() => Collection)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "collection_id",
    onDelete: "CASCADE",
  })
  collectionId!: string;
}
