import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { CollectionModel } from "./CollectionModel";

@Table({ tableName: "Collection_Series", timestamps: false })
export class CollectionSeriesModel extends Model {
  @ForeignKey(() => CollectionModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "collection_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  collectionId!: string;

  @ForeignKey(() => SeriesModel)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "series_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  seriesId!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "custom_order",
    defaultValue: 0,
  })
  customOrder!: number;
}
