import {
	BaseEntity,
	BeforeInsert,
	Column,
	Entity,
	OneToMany,
	PrimaryColumn,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { LibraryCollectionModel } from "@/api/v1/libraries/infrastructure/persistence/models/LibraryCollectionModel";
import { CollectionAlbumModel } from "./CollectionAlbum";
import { CollectionMovieModel } from "./CollectionMovie";
import { CollectionSeriesModel } from "./CollectionSeries";

@Entity({ name: "Collection" })
export class CollectionModel extends BaseEntity {
	@PrimaryColumn({ type: "varchar", nullable: false })
	id!: string;

	@Column({ type: "varchar", nullable: false, unique: true })
	title!: string;

	@Column({ type: "text", nullable: true, default: "" })
	description?: string;

	@Column({ type: "varchar", nullable: true, default: "" })
	posterSrc!: string;

	@Column({
		type: "simple-json",
		nullable: false,
		default: "[]",
		name: "posters_urls",
	})
	postersUrls!: string[];

	@Column({
		type: "varchar",
		nullable: true,
		default: "",
		name: "music_poster_src",
	})
	musicPosterSrc!: string;

	@Column({
		type: "simple-json",
		nullable: false,
		default: "[]",
		name: "music_posters_urls",
	})
	musicPostersUrls!: string[];

	@Column({
		type: "varchar",
		nullable: false,
		default: "",
		name: "background_src",
	})
	backgroundSrc!: string;

	@Column({
		type: "simple-json",
		nullable: false,
		default: "[]",
		name: "background_urls",
	})
	backgroundsUrls!: string[];

	@OneToMany(
		() => LibraryCollectionModel,
		(lc) => lc.collection,
		{
			cascade: true,
		},
	)
	libraryCollections!: LibraryCollectionModel[];

	@OneToMany(
		() => CollectionMovieModel,
		(cm) => cm.collection,
		{
			cascade: true,
		},
	)
	collectionMovies!: CollectionMovieModel[];

	@OneToMany(
		() => CollectionSeriesModel,
		(cs) => cs.collection,
		{
			cascade: true,
		},
	)
	collectionSeries!: CollectionSeriesModel[];

	@OneToMany(
		() => CollectionAlbumModel,
		(ca) => ca.collection,
		{
			cascade: true,
		},
	)
	collectionAlbums!: CollectionAlbumModel[];

	// Lifecycle hooks
	@BeforeInsert()
	generateId() {
		if (!this.id) {
			this.id = uuidv4().split("-")[0];
		}
	}
}
