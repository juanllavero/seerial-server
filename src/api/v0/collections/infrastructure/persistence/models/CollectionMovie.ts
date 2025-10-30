import { MovieModel } from "@/api/v0/movies/infrastructure/persistence/models/MovieModel";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { CollectionModel } from "./CollectionModel";

@Table({ tableName: "Collection_Movie", timestamps: false })
export class CollectionMovieModel extends Model {
  @ForeignKey(() => CollectionModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "collection_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  collectionId!: string;

  @ForeignKey(() => MovieModel)
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
