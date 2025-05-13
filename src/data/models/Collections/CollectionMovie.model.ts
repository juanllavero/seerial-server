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
    type: DataType.INTEGER,
    allowNull: false,
    field: "collection_id",
    onDelete: "CASCADE",
  })
  collectionId!: string;

  @ForeignKey(() => Movie)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "movie_id",
    onDelete: "CASCADE",
  })
  movieId!: string;
}
