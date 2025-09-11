import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { Movie } from "../Media/Movie.model";
import { Collection } from "./Collection.model";

@Table({ tableName: "Collection_Movie", timestamps: false })
export class CollectionMovie extends Model {
  @ForeignKey(() => Collection)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "collection_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  collectionId!: string;

  @ForeignKey(() => Movie)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "movie_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  movieId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "custom_order",
    defaultValue: 0,
  })
  customOrder!: number;
}
