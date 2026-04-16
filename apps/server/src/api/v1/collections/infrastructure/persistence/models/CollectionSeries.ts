import {
	BaseEntity,
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryColumn,
} from "typeorm";
import { SeriesModel } from "@/api/v1/series/infrastructure/persistence/models/SeriesModel";
import { CollectionModel } from "./CollectionModel";

@Entity({ name: "CollectionSeries" })
export class CollectionSeriesModel extends BaseEntity {
	@PrimaryColumn({ type: "varchar", nullable: false })
	collectionId!: string;

	@PrimaryColumn({ type: "varchar", nullable: false })
	seriesId!: string;

	@Column({
		type: "integer",
		nullable: false,
		default: 0,
		name: "custom_order",
	})
	customOrder!: number;

	@ManyToOne(() => CollectionModel, { onDelete: "CASCADE" })
	@JoinColumn({ name: "collection_id" })
	collection!: CollectionModel;

	@ManyToOne(() => SeriesModel, { onDelete: "CASCADE" })
	@JoinColumn({ name: "series_id" })
	series!: SeriesModel;
}
