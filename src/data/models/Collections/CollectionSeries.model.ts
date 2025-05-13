import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { Series } from "../Media/Series.model";
import { Collection } from "./Collection.model";

@Table({ tableName: "Collection_Series", timestamps: false })
export class CollectionSeries extends Model {
  @ForeignKey(() => Collection)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "collection_id",
    onDelete: "CASCADE",
  })
  collectionId!: string;

  @ForeignKey(() => Series)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "series_id",
    onDelete: "CASCADE",
  })
  seriesId!: string;
}
