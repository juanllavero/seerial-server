import { MovieModel } from "@/api/v1/movies/infrastructure/persistence/models/MovieModel";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "My_List", timestamps: false })
export class MyListModel extends Model {
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
    field: "user_id",
  })
  userId!: string;

  @Column({
    type: DataType.DATE,
    defaultValue: DataType.NOW,
    allowNull: false,
    field: "added_at",
  })
  addedAt!: Date;

  @ForeignKey(() => SeriesModel)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "series_id",
    onDelete: "CASCADE",
  })
  seriesId?: string;

  @ForeignKey(() => MovieModel)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "movie_id",
    onDelete: "CASCADE",
  })
  movieId?: string;
}
