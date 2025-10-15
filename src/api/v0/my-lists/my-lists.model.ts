import { Movie, Series } from "@/api/v0/index.models";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "My_List", timestamps: false })
export class MyList extends Model {
  @PrimaryKey
  @Column({
    type: DataType.STRING,
    defaultValue: () => require("uuid").v4().split("-")[0], // Generates default UUID
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

  @ForeignKey(() => Series)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "series_id",
    onDelete: "CASCADE",
  })
  seriesId?: string;

  @ForeignKey(() => Movie)
  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: "movie_id",
    onDelete: "CASCADE",
  })
  movieId?: string;
}
