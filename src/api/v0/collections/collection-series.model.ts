import { Collection, Series } from "@/api/v0/index.models";
import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";

@Table({ tableName: "Collection_Series", timestamps: false })
export class CollectionSeries extends Model {
  @ForeignKey(() => Collection)
  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: "collection_id",
    onDelete: "CASCADE",
    primaryKey: true,
  })
  collectionId!: string;

  @ForeignKey(() => Series)
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
